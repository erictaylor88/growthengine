import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

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

const platformLabels: Record<string, { icon: string; prefix: string }> = {
  reddit: { icon: "🔴", prefix: "r/" },
  x: { icon: "𝕏", prefix: "@" },
};

const statusStyles: Record<string, { bg: string; text: string }> = {
  pending: { bg: "bg-warning-muted", text: "text-warning" },
  approved: { bg: "bg-accent-muted", text: "text-accent-text" },
  published: { bg: "bg-success-muted", text: "text-success" },
  rejected: { bg: "bg-error-muted", text: "text-error" },
};

export default async function OverviewPage() {
  const supabase = await createClient();

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [
    pendingRes,
    publishedWeekRes,
    communitiesRes,
    productsRes,
    recentQueueRes,
    recentPublishedRes,
  ] = await Promise.all([
    supabase
      .from("content_queue")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("published_content")
      .select("id", { count: "exact", head: true })
      .gte("published_at", weekAgo),
    supabase
      .from("communities")
      .select("id, platform, name, display_name, scan_enabled"),
    supabase
      .from("products")
      .select("id, name, status"),
    supabase
      .from("content_queue")
      .select("id, community_id, content_type, draft_text, status, created_at")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("published_content")
      .select("id, community_id, content_type, text, platform, published_at")
      .order("published_at", { ascending: false })
      .limit(5),
  ]);

  const pendingCount = pendingRes.count ?? 0;
  const publishedWeekCount = publishedWeekRes.count ?? 0;
  const communities = communitiesRes.data ?? [];
  const products = productsRes.data ?? [];
  const recentQueue = recentQueueRes.data ?? [];
  const recentPublished = recentPublishedRes.data ?? [];

  const communityMap = new Map(communities.map((c) => [c.id, c]));
  const redditCount = communities.filter((c) => c.platform === "reddit").length;
  const xCount = communities.filter((c) => c.platform === "x").length;
  const activeProducts = products.filter((p) => p.status === "active").length;

  return (
    <div>
      <h1 className="text-[32px] font-semibold tracking-[-0.03em] leading-[1.2] text-text-primary">
        Overview
      </h1>
      <p className="mt-2 text-sm text-text-secondary">
        Dashboard home — metrics, pending queue, and recent activity.
      </p>

      {/* Metric cards */}
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          href="/queue"
          className="rounded-md border border-border-subtle bg-bg-raised p-4 hover:bg-[rgba(255,255,255,0.02)] transition-colors duration-150"
        >
          <p className="text-xs font-medium uppercase tracking-[0.04em] text-text-secondary">
            Pending
          </p>
          <p className="mt-2 font-mono text-2xl font-semibold text-text-primary">
            {pendingCount}
          </p>
          <p className="mt-1 font-mono text-xs text-text-tertiary">
            queue items
          </p>
        </Link>

        <div className="rounded-md border border-border-subtle bg-bg-raised p-4">
          <p className="text-xs font-medium uppercase tracking-[0.04em] text-text-secondary">
            Published
          </p>
          <p className="mt-2 font-mono text-2xl font-semibold text-text-primary">
            {publishedWeekCount}
          </p>
          <p className="mt-1 font-mono text-xs text-text-tertiary">
            this week
          </p>
        </div>

        <Link
          href="/communities"
          className="rounded-md border border-border-subtle bg-bg-raised p-4 hover:bg-[rgba(255,255,255,0.02)] transition-colors duration-150"
        >
          <p className="text-xs font-medium uppercase tracking-[0.04em] text-text-secondary">
            Communities
          </p>
          <p className="mt-2 font-mono text-2xl font-semibold text-text-primary">
            {communities.length}
          </p>
          <p className="mt-1 font-mono text-xs text-text-tertiary">
            {redditCount} reddit · {xCount} x
          </p>
        </Link>

        <Link
          href="/products"
          className="rounded-md border border-border-subtle bg-bg-raised p-4 hover:bg-[rgba(255,255,255,0.02)] transition-colors duration-150"
        >
          <p className="text-xs font-medium uppercase tracking-[0.04em] text-text-secondary">
            Products
          </p>
          <p className="mt-2 font-mono text-2xl font-semibold text-text-primary">
            {activeProducts}
          </p>
          <p className="mt-1 font-mono text-xs text-text-tertiary">
            active
          </p>
        </Link>
      </div>

      {/* Two-column: Pending Queue + Recent Activity */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Pending Queue */}
        <div className="rounded-md border border-border-subtle bg-bg-raised p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-medium tracking-[-0.01em] text-text-primary">
              Pending Queue
            </h2>
            {pendingCount > 0 && (
              <Link
                href="/queue"
                className="text-xs text-accent-text hover:underline"
              >
                View all →
              </Link>
            )}
          </div>

          {recentQueue.length === 0 ? (
            <p className="text-sm text-text-tertiary">
              No pending items.{" "}
              <Link href="/queue" className="text-accent-text hover:underline">
                Create a draft
              </Link>
            </p>
          ) : (
            <div className="space-y-2">
              {recentQueue.map((item) => {
                const community = communityMap.get(item.community_id);
                const pl = platformLabels[community?.platform ?? "reddit"];
                return (
                  <div
                    key={item.id}
                    className="rounded border border-border-subtle bg-bg-inset px-3 py-2.5"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px]">{pl?.icon}</span>
                      <span className="text-xs font-medium text-text-secondary">
                        {pl?.prefix}
                        {community?.name ?? "unknown"}
                      </span>
                      <span className="rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider bg-[rgba(255,255,255,0.06)] text-text-tertiary">
                        {item.content_type}
                      </span>
                      <span className="text-[10px] text-text-ghost ml-auto">
                        {timeAgo(item.created_at)}
                      </span>
                    </div>
                    <p className="text-[12px] font-mono text-text-primary/80 line-clamp-2 leading-relaxed">
                      {item.draft_text}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="rounded-md border border-border-subtle bg-bg-raised p-4">
          <h2 className="text-base font-medium tracking-[-0.01em] text-text-primary mb-4">
            Recent Activity
          </h2>

          {recentPublished.length === 0 ? (
            <p className="text-sm text-text-tertiary">
              No published content yet.
            </p>
          ) : (
            <div className="space-y-2">
              {recentPublished.map((item) => {
                const community = communityMap.get(item.community_id);
                const pl = platformLabels[item.platform];
                return (
                  <div
                    key={item.id}
                    className="rounded border border-border-subtle bg-bg-inset px-3 py-2.5"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px]">{pl?.icon}</span>
                      <span className="text-xs font-medium text-text-secondary">
                        {pl?.prefix}
                        {community?.name ?? "unknown"}
                      </span>
                      <span className="rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider bg-success-muted text-success">
                        published
                      </span>
                      <span className="text-[10px] text-text-ghost ml-auto">
                        {timeAgo(item.published_at)}
                      </span>
                    </div>
                    <p className="text-[12px] font-mono text-text-primary/80 line-clamp-2 leading-relaxed">
                      {item.text}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Community breakdown */}
      {communities.length > 0 && (
        <div className="mt-6 rounded-md border border-border-subtle bg-bg-raised p-4">
          <h2 className="text-base font-medium tracking-[-0.01em] text-text-primary mb-3">
            Tracked Communities
          </h2>
          <div className="flex flex-wrap gap-2">
            {communities.map((c) => {
              const pl = platformLabels[c.platform];
              return (
                <span
                  key={c.id}
                  className="flex items-center gap-1.5 rounded-full border border-border-subtle bg-bg-inset px-3 py-1"
                >
                  <span className="text-[10px]">{pl?.icon}</span>
                  <span className="text-xs text-text-secondary">
                    {pl?.prefix}
                    {c.name}
                  </span>
                  {!c.scan_enabled && (
                    <span className="text-[9px] text-text-ghost">paused</span>
                  )}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
