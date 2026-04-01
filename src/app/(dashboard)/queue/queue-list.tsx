"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/types";
import {
  Plus,
  Pencil,
  Check,
  X,
  SkipForward,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Link2,
} from "lucide-react";

type QueueItem = Tables<"content_queue">;
type CommunityRef = { id: string; platform: string; name: string; display_name: string | null };
type ProductRef = { id: string; name: string };

const STATUS_OPTIONS = ["all", "pending", "approved", "rejected", "published"] as const;
type StatusFilter = (typeof STATUS_OPTIONS)[number];

const CONTENT_TYPES = ["comment", "post", "reply"] as const;

const statusStyles: Record<string, { bg: string; text: string }> = {
  pending: { bg: "bg-warning-muted", text: "text-warning" },
  approved: { bg: "bg-accent-muted", text: "text-accent-text" },
  published: { bg: "bg-success-muted", text: "text-success" },
  rejected: { bg: "bg-error-muted", text: "text-error" },
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
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function QueueList({
  initialItems,
  communities,
  products,
}: {
  initialItems: QueueItem[];
  communities: CommunityRef[];
  products: ProductRef[];
}) {
  const [items, setItems] = useState<QueueItem[]>(initialItems);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending");
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [showNewDraft, setShowNewDraft] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const router = useRouter();
  const supabase = createClient();

  // --- New draft form state ---
  const [newCommunityId, setNewCommunityId] = useState("");
  const [newProductId, setNewProductId] = useState("");
  const [newContentType, setNewContentType] = useState<string>("comment");
  const [newDraftText, setNewDraftText] = useState("");
  const [newError, setNewError] = useState<string | null>(null);
  const [newSaving, setNewSaving] = useState(false);

  // --- Mark as published state ---
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [publishUrl, setPublishUrl] = useState("");

  // --- Helpers ---
  const communityMap = new Map(communities.map((c) => [c.id, c]));
  const productMap = new Map(products.map((p) => [p.id, p]));

  function getCommunityPlatform(communityId: string): string {
    return communityMap.get(communityId)?.platform ?? "reddit";
  }

  // --- Filtering ---
  const filtered = items.filter((item) => {
    if (statusFilter !== "all" && item.status !== statusFilter) return false;
    if (platformFilter !== "all") {
      const platform = getCommunityPlatform(item.community_id);
      if (platform !== platformFilter) return false;
    }
    return true;
  });

  const pendingCount = items.filter((i) => i.status === "pending").length;

  // --- Keyboard shortcuts ---
  // Reset selection when filters change
  useEffect(() => {
    setSelectedIndex(-1);
  }, [statusFilter, platformFilter]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't handle shortcuts when typing in inputs/textareas or when slide-over is open
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (showNewDraft) return;
      if (editingId) return;

      switch (e.key) {
        case "j": {
          e.preventDefault();
          setSelectedIndex((prev) => Math.min(prev + 1, filtered.length - 1));
          break;
        }
        case "k": {
          e.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
          break;
        }
        case "a": {
          e.preventDefault();
          if (selectedIndex >= 0 && selectedIndex < filtered.length) {
            const item = filtered[selectedIndex];
            if (item.status === "pending") updateStatus(item.id, "approved");
          }
          break;
        }
        case "r": {
          e.preventDefault();
          if (selectedIndex >= 0 && selectedIndex < filtered.length) {
            const item = filtered[selectedIndex];
            if (item.status === "pending") updateStatus(item.id, "rejected");
          }
          break;
        }
        case "e": {
          e.preventDefault();
          if (selectedIndex >= 0 && selectedIndex < filtered.length) {
            const item = filtered[selectedIndex];
            if (item.status === "pending") startEdit(item);
          }
          break;
        }
        case "n": {
          e.preventDefault();
          setShowNewDraft(true);
          break;
        }
        case "Escape": {
          setSelectedIndex(-1);
          break;
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [filtered, selectedIndex, showNewDraft, editingId]);

  // --- Actions ---
  async function updateStatus(id: string, status: string) {
    setSaving(id);
    const { error } = await supabase
      .from("content_queue")
      .update({ status, reviewed_at: new Date().toISOString() })
      .eq("id", id);

    if (!error) {
      setItems((prev) =>
        prev.map((i) =>
          i.id === id
            ? { ...i, status, reviewed_at: new Date().toISOString() }
            : i
        )
      );
    }
    setSaving(null);
  }

  function startEdit(item: QueueItem) {
    setEditingId(item.id);
    setEditText(item.draft_text);
  }

  async function saveEdit(id: string) {
    if (!editText.trim()) return;
    setSaving(id);
    const { error } = await supabase
      .from("content_queue")
      .update({ draft_text: editText.trim() })
      .eq("id", id);

    if (!error) {
      setItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, draft_text: editText.trim() } : i))
      );
    }
    setEditingId(null);
    setSaving(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditText("");
  }

  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // --- Mark as Published ---
  async function markPublished(item: QueueItem) {
    setSaving(item.id);
    const community = communityMap.get(item.community_id);

    // Create published_content record
    const { error: pubErr } = await supabase.from("published_content").insert({
      queue_item_id: item.id,
      community_id: item.community_id,
      product_id: item.product_id,
      platform: community?.platform ?? "reddit",
      content_type: item.content_type,
      text: item.draft_text,
      url: publishUrl.trim() || null,
      external_id: null,
    });

    if (!pubErr) {
      // Update queue item status
      await supabase
        .from("content_queue")
        .update({ status: "published", reviewed_at: new Date().toISOString() })
        .eq("id", item.id);

      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id
            ? { ...i, status: "published", reviewed_at: new Date().toISOString() }
            : i
        )
      );
    }

    setPublishingId(null);
    setPublishUrl("");
    setSaving(null);
    router.refresh();
  }

  // --- New Draft ---
  function resetNewDraft() {
    setNewCommunityId("");
    setNewProductId("");
    setNewContentType("comment");
    setNewDraftText("");
    setNewError(null);
    setShowNewDraft(false);
  }

  async function handleCreateDraft() {
    if (!newCommunityId) {
      setNewError("Community is required.");
      return;
    }
    if (!newDraftText.trim()) {
      setNewError("Draft text is required.");
      return;
    }
    setNewSaving(true);
    setNewError(null);

    const { data, error } = await supabase
      .from("content_queue")
      .insert({
        community_id: newCommunityId,
        product_id: newProductId || null,
        content_type: newContentType,
        draft_text: newDraftText.trim(),
        status: "pending",
      })
      .select(
        "id, thread_id, community_id, product_id, content_type, draft_text, status, created_at, reviewed_at"
      )
      .single();

    if (error) {
      setNewError(error.message);
      setNewSaving(false);
      return;
    }

    setItems((prev) => [data, ...prev]);
    setNewSaving(false);
    resetNewDraft();
    router.refresh();
  }

  return (
    <div className="mt-6">
      {/* --- Top bar: count + filters + new draft button --- */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <span className="text-sm font-mono text-text-secondary">
            {pendingCount > 0
              ? `${pendingCount} pending`
              : "0 pending"}
          </span>

          {/* Status filter pills */}
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

          {/* Platform filter */}
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

        <button
          onClick={() => setShowNewDraft(true)}
          className="flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-[#09090B] hover:bg-accent-hover active:opacity-80 transition-colors duration-150"
        >
          <Plus className="h-4 w-4" />
          New Draft
        </button>
      </div>

      {/* --- New Draft Slide-over --- */}
      {showNewDraft && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/50"
            onClick={resetNewDraft}
          />
          {/* Panel */}
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md overflow-y-auto border-l border-border-subtle bg-bg-raised p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-[20px] font-semibold tracking-[-0.02em] text-text-primary">
                New Draft
              </h2>
              <button
                onClick={resetNewDraft}
                className="rounded p-1.5 text-text-tertiary hover:text-text-secondary hover:bg-[rgba(255,255,255,0.04)] transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Community */}
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">
                  Community *
                </label>
                <select
                  value={newCommunityId}
                  onChange={(e) => setNewCommunityId(e.target.value)}
                  className="block w-full rounded-md border border-border-default bg-bg-base px-3 py-2 text-sm text-text-primary focus:border-border-strong focus:outline-none focus:ring-1 focus:ring-accent"
                >
                  <option value="">Select community…</option>
                  {communities.map((c) => (
                    <option key={c.id} value={c.id}>
                      {platformLabels[c.platform]?.prefix ?? ""}
                      {c.name}
                      {c.display_name ? ` — ${c.display_name}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Product (optional) */}
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">
                  Product{" "}
                  <span className="text-text-tertiary font-normal">
                    (optional)
                  </span>
                </label>
                <select
                  value={newProductId}
                  onChange={(e) => setNewProductId(e.target.value)}
                  className="block w-full rounded-md border border-border-default bg-bg-base px-3 py-2 text-sm text-text-primary focus:border-border-strong focus:outline-none focus:ring-1 focus:ring-accent"
                >
                  <option value="">No product (karma building)</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Content type */}
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">
                  Content Type
                </label>
                <div className="flex gap-2">
                  {CONTENT_TYPES.map((ct) => (
                    <button
                      key={ct}
                      onClick={() => setNewContentType(ct)}
                      className={`rounded-md px-3 py-1.5 text-sm capitalize transition-colors duration-150 ${
                        newContentType === ct
                          ? "bg-accent-muted text-accent-text border border-accent"
                          : "border border-border-default text-text-secondary hover:bg-[rgba(255,255,255,0.04)]"
                      }`}
                    >
                      {ct}
                    </button>
                  ))}
                </div>
              </div>

              {/* Draft text */}
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">
                  Draft Text *
                </label>
                <textarea
                  value={newDraftText}
                  onChange={(e) => setNewDraftText(e.target.value)}
                  rows={8}
                  placeholder="Write your comment or post…"
                  className="block w-full rounded-md border border-border-default bg-bg-base px-3 py-2 text-[13px] font-mono text-text-primary placeholder:text-text-tertiary focus:border-border-strong focus:outline-none focus:ring-1 focus:ring-accent resize-none leading-relaxed"
                />
              </div>

              {newError && <p className="text-xs text-error">{newError}</p>}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleCreateDraft}
                  disabled={newSaving}
                  className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-[#09090B] hover:bg-accent-hover disabled:opacity-40 transition-colors duration-150"
                >
                  {newSaving ? "Creating…" : "Create Draft"}
                </button>
                <button
                  onClick={resetNewDraft}
                  className="rounded-md border border-border-default px-4 py-2 text-sm text-text-primary hover:bg-[rgba(255,255,255,0.04)] transition-colors duration-150"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* --- Queue Item Cards --- */}
      <div className="mt-4 space-y-2">
        {filtered.map((item, index) => {
          const community = communityMap.get(item.community_id);
          const product = item.product_id
            ? productMap.get(item.product_id)
            : null;
          const platform = community?.platform ?? "reddit";
          const pl = platformLabels[platform];
          const ss = statusStyles[item.status] ?? statusStyles.pending;
          const isEditing = editingId === item.id;
          const isExpanded = expandedIds.has(item.id);
          const isLongDraft = item.draft_text.split("\n").length > 6 || item.draft_text.length > 400;
          const isSaving = saving === item.id;
          const isSelected = selectedIndex === index;

          return (
            <div
              key={item.id}
              onClick={() => setSelectedIndex(index)}
              className={`rounded-md border p-4 transition-colors duration-150 cursor-default ${
                isSelected
                  ? "border-accent/40 bg-[rgba(20,184,166,0.04)]"
                  : "border-border-subtle bg-bg-raised hover:bg-[rgba(255,255,255,0.02)]"
              }`}
            >
              {/* Top row: platform + community | content type + status */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs" title={platform}>
                    {pl?.icon}
                  </span>
                  <span className="text-sm font-medium text-text-primary truncate">
                    {pl?.prefix}
                    {community?.name ?? "unknown"}
                  </span>
                  <span className="text-xs text-text-tertiary">
                    {timeAgo(item.created_at)}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="rounded px-2 py-0.5 text-[11px] font-medium uppercase tracking-[0.04em] bg-[rgba(255,255,255,0.06)] text-text-tertiary">
                    {item.content_type}
                  </span>
                  <span
                    className={`rounded px-2 py-0.5 text-[11px] font-medium uppercase tracking-[0.04em] ${ss.bg} ${ss.text}`}
                  >
                    {item.status}
                  </span>
                </div>
              </div>

              {/* Draft text */}
              <div className="mt-3">
                {isEditing ? (
                  <div className="space-y-2">
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      rows={6}
                      className="block w-full rounded-md border border-border-default bg-bg-base px-3 py-2 text-[13px] font-mono text-text-primary focus:border-border-strong focus:outline-none focus:ring-1 focus:ring-accent resize-y leading-relaxed"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveEdit(item.id)}
                        disabled={isSaving}
                        className="rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-[#09090B] hover:bg-accent-hover disabled:opacity-40 transition-colors"
                      >
                        {isSaving ? "Saving…" : "Save"}
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="rounded-md border border-border-default px-3 py-1.5 text-xs text-text-primary hover:bg-[rgba(255,255,255,0.04)] transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p
                      className={`text-[13px] font-mono text-text-primary/90 whitespace-pre-wrap leading-relaxed ${
                        !isExpanded && isLongDraft
                          ? "line-clamp-6"
                          : ""
                      }`}
                    >
                      {item.draft_text}
                    </p>
                    {isLongDraft && (
                      <button
                        onClick={() => toggleExpand(item.id)}
                        className="mt-1 flex items-center gap-1 text-[11px] text-text-tertiary hover:text-text-secondary transition-colors"
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp className="h-3 w-3" /> Show less
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-3 w-3" /> Show more
                          </>
                        )}
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Bottom row: product tag | actions */}
              {!isEditing && (
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {product && (
                      <span className="rounded-full px-2 py-0.5 text-[11px] bg-bg-inset text-text-tertiary">
                        {product.name}
                      </span>
                    )}
                  </div>

                  {item.status === "pending" && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => startEdit(item)}
                        disabled={isSaving}
                        className="flex items-center gap-1.5 rounded-md border border-border-default px-3 py-1.5 text-xs text-text-secondary hover:bg-[rgba(255,255,255,0.04)] transition-colors disabled:opacity-40"
                        title="Edit"
                      >
                        <Pencil className="h-3 w-3" />
                        Edit
                      </button>
                      <button
                        onClick={() => updateStatus(item.id, "approved")}
                        disabled={isSaving}
                        className="flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-[#09090B] hover:bg-accent-hover transition-colors disabled:opacity-40"
                        title="Approve"
                      >
                        <Check className="h-3 w-3" />
                        Approve
                      </button>
                      <button
                        onClick={() => updateStatus(item.id, "rejected")}
                        disabled={isSaving}
                        className="flex items-center gap-1.5 rounded-md border border-border-default px-3 py-1.5 text-xs text-text-tertiary hover:text-error hover:border-error/30 transition-colors disabled:opacity-40"
                        title="Skip"
                      >
                        <SkipForward className="h-3 w-3" />
                        Skip
                      </button>
                    </div>
                  )}

                  {item.status === "approved" && (
                    <div className="flex items-center gap-2 flex-wrap">
                      {publishingId === item.id ? (
                        <div className="flex items-center gap-2 w-full">
                          <input
                            value={publishUrl}
                            onChange={(e) => setPublishUrl(e.target.value)}
                            placeholder="Paste URL after posting manually (optional)"
                            className="flex-1 rounded-md border border-border-default bg-bg-base px-2 py-1.5 text-xs font-mono text-text-primary placeholder:text-text-tertiary focus:border-border-strong focus:outline-none focus:ring-1 focus:ring-accent"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === "Enter") markPublished(item);
                              if (e.key === "Escape") {
                                setPublishingId(null);
                                setPublishUrl("");
                              }
                            }}
                          />
                          <button
                            onClick={() => markPublished(item)}
                            disabled={isSaving}
                            className="flex items-center gap-1 rounded-md bg-success/90 px-3 py-1.5 text-xs font-medium text-[#09090B] hover:bg-success transition-colors disabled:opacity-40 shrink-0"
                          >
                            <Check className="h-3 w-3" />
                            Confirm
                          </button>
                          <button
                            onClick={() => {
                              setPublishingId(null);
                              setPublishUrl("");
                            }}
                            className="rounded-md border border-border-default px-2 py-1.5 text-xs text-text-tertiary hover:text-text-secondary transition-colors shrink-0"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setPublishingId(item.id)}
                          className="flex items-center gap-1.5 rounded-md border border-border-default px-3 py-1.5 text-xs text-text-secondary hover:bg-[rgba(255,255,255,0.04)] transition-colors"
                        >
                          <Link2 className="h-3 w-3" />
                          Mark as Published
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* --- Empty state --- */}
      {filtered.length === 0 && (
        <div className="mt-8 text-center">
          <p className="text-sm text-text-tertiary">
            {items.length === 0
              ? "No drafts yet. Create one to get started."
              : "No items match the current filters."}
          </p>
        </div>
      )}

      {/* --- Keyboard shortcuts hint --- */}
      {filtered.length > 0 && (
        <div className="mt-4 flex items-center justify-center gap-4 text-[10px] text-text-ghost">
          <span>
            <kbd className="rounded border border-border-subtle bg-bg-inset px-1.5 py-0.5 font-mono">j</kbd>
            <kbd className="rounded border border-border-subtle bg-bg-inset px-1.5 py-0.5 font-mono ml-0.5">k</kbd>
            {" "}navigate
          </span>
          <span>
            <kbd className="rounded border border-border-subtle bg-bg-inset px-1.5 py-0.5 font-mono">a</kbd>
            {" "}approve
          </span>
          <span>
            <kbd className="rounded border border-border-subtle bg-bg-inset px-1.5 py-0.5 font-mono">r</kbd>
            {" "}reject
          </span>
          <span>
            <kbd className="rounded border border-border-subtle bg-bg-inset px-1.5 py-0.5 font-mono">e</kbd>
            {" "}edit
          </span>
          <span>
            <kbd className="rounded border border-border-subtle bg-bg-inset px-1.5 py-0.5 font-mono">n</kbd>
            {" "}new draft
          </span>
        </div>
      )}
    </div>
  );
}
