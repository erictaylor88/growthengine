export default function CommunitiesPage() {
  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[32px] font-semibold tracking-[-0.03em] leading-[1.2] text-text-primary">
            Communities
          </h1>
          <p className="mt-2 text-sm text-text-secondary">
            Manage tracked subreddits and X accounts.
          </p>
        </div>
      </div>

      <div className="mt-8">
        <p className="text-sm text-text-tertiary">No communities added yet.</p>
      </div>
    </div>
  );
}
