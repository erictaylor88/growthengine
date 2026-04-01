export default function OverviewPage() {
  return (
    <div>
      <h1 className="text-[32px] font-semibold tracking-[-0.03em] leading-[1.2] text-text-primary">
        Overview
      </h1>
      <p className="mt-2 text-sm text-text-secondary">
        Dashboard home — metrics, pending queue, and recent activity.
      </p>

      {/* Metric cards placeholder */}
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Pending", value: "0", sub: "queue items" },
          { label: "Published", value: "0", sub: "this week" },
          { label: "Reddit Karma", value: "—", sub: "total" },
          { label: "X Followers", value: "—", sub: "total" },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-md border border-border-subtle bg-bg-raised p-4"
          >
            <p className="text-xs font-medium uppercase tracking-[0.04em] text-text-secondary">
              {card.label}
            </p>
            <p className="mt-2 font-mono text-2xl font-semibold text-text-primary">
              {card.value}
            </p>
            <p className="mt-1 font-mono text-xs text-text-tertiary">
              {card.sub}
            </p>
          </div>
        ))}
      </div>

      {/* Placeholder sections */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-md border border-border-subtle bg-bg-raised p-4">
          <h2 className="text-base font-medium tracking-[-0.01em] text-text-primary">
            Pending Queue
          </h2>
          <p className="mt-4 text-sm text-text-tertiary">
            No pending items.
          </p>
        </div>
        <div className="rounded-md border border-border-subtle bg-bg-raised p-4">
          <h2 className="text-base font-medium tracking-[-0.01em] text-text-primary">
            Recent Activity
          </h2>
          <p className="mt-4 text-sm text-text-tertiary">
            No recent activity.
          </p>
        </div>
      </div>
    </div>
  );
}
