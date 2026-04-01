"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/types";
import {
  ExternalLink,
  MessageSquarePlus,
  SkipForward,
  X,
  Search,
} from "lucide-react";

type Thread = Tables<"discovered_threads">;
type CommunityRef = { id: string; platform: string; name: string; display_name: string | null };
type ProductRef = { id: string; name: string };

const STATUS_OPTIONS = ["all", "new", "queued", "skipped", "engaged"] as const;
type StatusFilter = (typeof STATUS_OPTIONS)[number];

const statusStyles: Record<string, { bg: string; text: string }> = {
  new: { bg: "bg-info-muted", text: "text-info" },
  queued: { bg: "bg-accent-muted", text: "text-accent-text" },
  skipped: { bg: "bg-[rgba(255,255,255,0.06)]", text: "text-text-tertiary" },
  engaged: { bg: "bg-success-muted", text: "text-success" },
};

const platformLabels: Record<string, { icon: string; prefix: string }> = {
  reddit: { icon: "🔴", prefix: "r/" },
  x: { icon: "𝕏", prefix: "@" },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function DiscoveredList({
  initialThreads,
  communities,
  products,
}: {
  initialThreads: Thread[];
  communities: CommunityRef[];
  products: ProductRef[];
}) {
  const [threads, setThreads] = useState<Thread[]>(initialThreads);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("new");
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [draftingId, setDraftingId] = useState<string | null>(null);
  const [draftText, setDraftText] = useState("");
  const [draftProductId, setDraftProductId] = useState("");
  const [saving, setSaving] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const communityMap = new Map(communities.map((c) => [c.id, c]));

  const filtered = threads.filter((t) => {
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    if (platformFilter !== "all" && t.platform !== platformFilter) return false;
    return true;
  });

  const newCount = threads.filter((t) => t.status === "new").length;

  async function skipThread(id: string) {
    setSaving(id);
    const { error } = await supabase
      .from("discovered_threads")
      .update({ status: "skipped" })
      .eq("id", id);
    if (!error) {
      setThreads((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status: "skipped" } : t))
      );
    }
    setSaving(null);
  }

  function startDraft(thread: Thread) {
    setDraftingId(thread.id);
    setDraftText("");
    setDraftProductId("");
  }

  function cancelDraft() {
    setDraftingId(null);
    setDraftText("");
    setDraftProductId("");
  }

  async function submitDraft(thread: Thread) {
    if (!draftText.trim()) return;
    setSaving(thread.id);

    const { error: queueErr } = await supabase.from("content_queue").insert({
      thread_id: thread.id,
      community_id: thread.community_id,
      product_id: draftProductId || null,
      content_type: "comment",
      draft_text: draftText.trim(),
      status: "pending",
    });

    if (!queueErr) {
      const { error: threadErr } = await supabase
        .from("discovered_threads")
        .update({ status: "queued" })
        .eq("id", thread.id);

      if (!threadErr) {
        setThreads((prev) =>
          prev.map((t) => (t.id === thread.id ? { ...t, status: "queued" } : t))
        );
      }
    }

    setSaving(null);
    cancelDraft();
    router.refresh();
  }

  return (
    <div className="mt-6">
      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-sm font-mono text-text-secondary">
          {newCount} new
        </span>

        <div className="flex items-center gap-1">
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-full px-3 py-1 text-[11px] font-medium capitalize transition-colors duration-150 ${
                statusFilter === s
                  ? "bg-accent-muted text-accent-text"
                  : "bg-[rgba(255,255,255,0.04)] text-text-tertiary hover:text-text-secondary"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 ml-2">
          {["all", "reddit", "x"].map((p) => (
            <button
              key={p}
              onClick={() => setPlatformFilter(p)}
              className={`rounded-full px-3 py-1 text-[11px] font-medium capitalize transition-colors duration-150 ${
                platformFilter === p
                  ? "bg-accent-muted text-accent-text"
                  : "bg-[rgba(255,255,255,0.04)] text-text-tertiary hover:text-text-secondary"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Thread cards */}
      <div className="mt-4 space-y-2">
        {filtered.map((thread) => {
          const community = communityMap.get(thread.community_id);
          const pl = platformLabels[thread.platform];
          const ss = statusStyles[thread.status] ?? statusStyles.new;
          const isDrafting = draftingId === thread.id;
          const isSaving = saving === thread.id;

          return (
            <div
              key={thread.id}
              className="rounded-md border border-border-subtle bg-bg-raised p-4 hover:bg-[rgba(255,255,255,0.02)] transition-colors duration-150"
            >
              {/* Top: platform + community | author + status */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs">{pl?.icon}</span>
                  <span className="text-sm font-medium text-text-primary truncate">
                    {pl?.prefix}
                    {community?.name ?? "unknown"}
                  </span>
                  {thread.author && (
                    <span className="text-xs text-text-tertiary">
                      by u/{thread.author}
                    </span>
                  )}
                  <span className="text-xs text-text-ghost">
                    {timeAgo(thread.discovered_at)}
                  </span>
                </div>
                <span
                  className={`shrink-0 rounded px-2 py-0.5 text-[11px] font-medium uppercase tracking-[0.04em] ${ss.bg} ${ss.text}`}
                >
                  {thread.status}
                </span>
              </div>

              {/* Title */}
              {thread.title && (
                <div className="mt-2">
                  {thread.url ? (
                    <a
                      href={thread.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-text-primary hover:text-accent-text transition-colors inline-flex items-center gap-1.5"
                    >
                      {thread.title}
                      <ExternalLink className="h-3 w-3 text-text-tertiary" />
                    </a>
                  ) : (
                    <p className="text-sm font-medium text-text-primary">
                      {thread.title}
                    </p>
                  )}
                </div>
              )}

              {/* Body preview */}
              {thread.body_preview && (
                <p className="mt-1.5 text-[12px] font-mono text-text-secondary/80 line-clamp-3 leading-relaxed">
                  {thread.body_preview}
                </p>
              )}

              {/* Draft reply form */}
              {isDrafting && (
                <div className="mt-3 space-y-2 border-t border-border-subtle pt-3">
                  <textarea
                    value={draftText}
                    onChange={(e) => setDraftText(e.target.value)}
                    rows={4}
                    placeholder="Write your reply…"
                    className="block w-full rounded-md border border-border-default bg-bg-base px-3 py-2 text-[13px] font-mono text-text-primary placeholder:text-text-tertiary focus:border-border-strong focus:outline-none focus:ring-1 focus:ring-accent resize-y leading-relaxed"
                    autoFocus
                  />
                  <div className="flex items-center gap-3">
                    <select
                      value={draftProductId}
                      onChange={(e) => setDraftProductId(e.target.value)}
                      className="rounded-md border border-border-default bg-bg-base px-2 py-1.5 text-xs text-text-primary focus:border-border-strong focus:outline-none focus:ring-1 focus:ring-accent"
                    >
                      <option value="">No product</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                    <div className="flex gap-2 ml-auto">
                      <button
                        onClick={() => submitDraft(thread)}
                        disabled={isSaving || !draftText.trim()}
                        className="rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-[#09090B] hover:bg-accent-hover disabled:opacity-40 transition-colors"
                      >
                        {isSaving ? "Sending…" : "Add to Queue"}
                      </button>
                      <button
                        onClick={cancelDraft}
                        className="rounded-md border border-border-default px-3 py-1.5 text-xs text-text-primary hover:bg-[rgba(255,255,255,0.04)] transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              {!isDrafting && thread.status === "new" && (
                <div className="mt-3 flex items-center gap-1">
                  <button
                    onClick={() => startDraft(thread)}
                    disabled={isSaving}
                    className="flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-[#09090B] hover:bg-accent-hover transition-colors disabled:opacity-40"
                  >
                    <MessageSquarePlus className="h-3 w-3" />
                    Draft Reply
                  </button>
                  <button
                    onClick={() => skipThread(thread.id)}
                    disabled={isSaving}
                    className="flex items-center gap-1.5 rounded-md border border-border-default px-3 py-1.5 text-xs text-text-tertiary hover:text-text-secondary transition-colors disabled:opacity-40"
                  >
                    <SkipForward className="h-3 w-3" />
                    Skip
                  </button>
                  {thread.url && (
                    <a
                      href={thread.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 rounded-md border border-border-default px-3 py-1.5 text-xs text-text-tertiary hover:text-text-secondary transition-colors ml-auto"
                    >
                      <ExternalLink className="h-3 w-3" />
                      View
                    </a>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="mt-8 text-center">
          {threads.length === 0 ? (
            <div className="rounded-md border border-border-subtle bg-bg-raised p-8">
              <Search className="h-8 w-8 text-text-ghost mx-auto mb-3" />
              <p className="text-sm text-text-secondary">
                No discovered threads yet.
              </p>
              <p className="mt-2 text-xs text-text-tertiary max-w-md mx-auto">
                Threads will appear here once automated scanning is set up.
                Scanning runs hourly via Supabase Edge Functions, checking your
                tracked communities for threads matching your keywords.
              </p>
            </div>
          ) : (
            <p className="text-sm text-text-tertiary">
              No threads match the current filters.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
