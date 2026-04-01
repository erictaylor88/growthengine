import { createClient } from "@/lib/supabase/server";
import { BarChart3, TrendingUp, Activity, Users } from "lucide-react";

export default async function AnalyticsPage() {
  const supabase = await createClient();

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [
    publishedTotalRes,
    publishedWeekRes,
    publishedMonthRes,
    queueTotalRes,
    queueApprovedRes,
    metricsRes,
    publishedByPlatformRes,
  ] = await Promise.all([
    supabase
      .from("published_content")
      .select("id", { count: "exact", head: true }),
    supabase
      .from("published_content")
      .select("id", { count: "exact", head: true })
      .gte("published_at", weekAgo),
    supabase
      .from("published_content")
      .select("id", { count: "exact", head: true })
      .gte("published_at", monthAgo),
    supabase
      .from("content_queue")
      .select("id", { count: "exact", head: true }),
    supabase
      .from("content_queue")
      .select("id", { count: "exact", head: true })
      .eq("status", "approved"),
    supabase
      .from("account_metrics")
      .select("platform, reddit_karma, x_followers, snapshot_date")
      .order("snapshot_date", { ascending: false })
      .limit(10),
    supabase
      .from("published_content")
      .select("platform"),
  ]);

  const publishedTotal = publishedTotalRes.count ?? 0;
  const publishedWeek = publishedWeekRes.count ?? 0;
  const publishedMonth = publishedMonthRes.count ?? 0;
  const queueTotal = queueTotalRes.count ?? 0;
  const queueApproved = queueApprovedRes.count ?? 0;
  const metrics = metricsRes.data ?? [];
  const publishedByPlatform = publishedByPlatformRes.data ?? [];

  const latestReddit = metrics.find((m) => m.platform === "reddit");
  const latestX = metrics.find((m) => m.platform === "x");
  const redditPublished = publishedByPlatform.filter((p) => p.platform === "reddit").length;
  const xPublished = publishedByPlatform.filter((p) => p.platform === "x").length;

  const hasData = publishedTotal > 0 || queueTotal > 0;

  return (
    <div>
      <h1 className="text-[32px] font-semibold tracking-[-0.03em] leading-[1.2] text-text-primary">
        Analytics
      </h1>
      <p className="mt-2 text-sm text-text-secondary">
        Engagement metrics, growth tracking, and content performance.
      </p>

      {/* Summary metrics */}
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-md border border-border-subtle bg-bg-raised p-4">
          <p className="text-xs font-medium uppercase tracking-[0.04em] text-text-secondary">
            Published Total
          </p>
          <p className="mt-2 font-mono text-2xl font-semibold text-text-primary">
            {publishedTotal}
          </p>
          <p className="mt-1 font-mono text-xs text-text-tertiary">
            {redditPublished} reddit · {xPublished} x
          </p>
        </div>

        <div className="rounded-md border border-border-subtle bg-bg-raised p-4">
          <p className="text-xs font-medium uppercase tracking-[0.04em] text-text-secondary">
            This Week
          </p>
          <p className="mt-2 font-mono text-2xl font-semibold text-text-primary">
            {publishedWeek}
          </p>
          <p className="mt-1 font-mono text-xs text-text-tertiary">
            published
          </p>
        </div>

        <div className="rounded-md border border-border-subtle bg-bg-raised p-4">
          <p className="text-xs font-medium uppercase tracking-[0.04em] text-text-secondary">
            Reddit Karma
          </p>
          <p className="mt-2 font-mono text-2xl font-semibold text-text-primary">
            {latestReddit?.reddit_karma ?? "—"}
          </p>
          <p className="mt-1 font-mono text-xs text-text-tertiary">
            {latestReddit ? `as of ${latestReddit.snapshot_date}` : "no snapshots yet"}
          </p>
        </div>

        <div className="rounded-md border border-border-subtle bg-bg-raised p-4">
          <p className="text-xs font-medium uppercase tracking-[0.04em] text-text-secondary">
            X Followers
          </p>
          <p className="mt-2 font-mono text-2xl font-semibold text-text-primary">
            {latestX?.x_followers ?? "—"}
          </p>
          <p className="mt-1 font-mono text-xs text-text-tertiary">
            {latestX ? `as of ${latestX.snapshot_date}` : "no snapshots yet"}
          </p>
        </div>
      </div>

      {/* Content sections */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Queue funnel */}
        <div className="rounded-md border border-border-subtle bg-bg-raised p-4">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-4 w-4 text-text-tertiary" />
            <h2 className="text-base font-medium tracking-[-0.01em] text-text-primary">
              Queue Funnel
            </h2>
          </div>
          {queueTotal > 0 ? (
            <div className="space-y-3">
              {[
                { label: "Total Drafts", value: queueTotal },
                { label: "Approved", value: queueApproved },
                { label: "Published", value: publishedTotal },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between"
                >
                  <span className="text-sm text-text-secondary">
                    {row.label}
                  </span>
                  <span className="font-mono text-sm font-medium text-text-primary">
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-tertiary">
              Create drafts in the queue to start tracking your content funnel.
            </p>
          )}
        </div>

        {/* Account growth placeholder */}
        <div className="rounded-md border border-border-subtle bg-bg-raised p-4">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-4 w-4 text-text-tertiary" />
            <h2 className="text-base font-medium tracking-[-0.01em] text-text-primary">
              Account Growth
            </h2>
          </div>
          {metrics.length > 0 ? (
            <div className="space-y-3">
              {metrics.slice(0, 5).map((m) => (
                <div
                  key={m.snapshot_date + m.platform}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-text-secondary">
                    {m.platform} · {m.snapshot_date}
                  </span>
                  <span className="font-mono text-text-primary">
                    {m.platform === "reddit"
                      ? `${m.reddit_karma ?? "—"} karma`
                      : `${m.x_followers ?? "—"} followers`}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-tertiary">
              Account metrics will appear here once daily snapshots are running
              via the Supabase cron job (Phase 4).
            </p>
          )}
        </div>

        {/* Engagement tracking placeholder */}
        <div className="rounded-md border border-border-subtle bg-bg-raised p-4">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-4 w-4 text-text-tertiary" />
            <h2 className="text-base font-medium tracking-[-0.01em] text-text-primary">
              Engagement Tracking
            </h2>
          </div>
          <p className="text-sm text-text-tertiary">
            Upvotes, comments, impressions, and likes per published piece will
            appear here once the engagement polling Edge Function is running
            (Phase 4).
          </p>
        </div>

        {/* Product attribution placeholder */}
        <div className="rounded-md border border-border-subtle bg-bg-raised p-4">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-4 w-4 text-text-tertiary" />
            <h2 className="text-base font-medium tracking-[-0.01em] text-text-primary">
              Product Attribution
            </h2>
          </div>
          <p className="text-sm text-text-tertiary">
            See which products each piece of content supports and track
            engagement per product. Requires published content with product tags.
          </p>
        </div>
      </div>
    </div>
  );
}
