export default function DiscoveredPage() {
  return (
    <div>
      <h1 className="text-[32px] font-semibold tracking-[-0.03em] leading-[1.2] text-text-primary">
        Discovered
      </h1>
      <p className="mt-2 text-sm text-text-secondary">
        Threads and posts discovered by automated scanning.
      </p>

      <div className="mt-8">
        <p className="text-sm text-text-tertiary">No discovered threads yet.</p>
      </div>
    </div>
  );
}
