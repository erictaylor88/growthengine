import { createClient } from "@/lib/supabase/server";
import { QueueList } from "./queue-list";

export default async function QueuePage() {
  const supabase = await createClient();

  const [queueRes, communitiesRes, productsRes] = await Promise.all([
    supabase
      .from("content_queue")
      .select(
        "id, thread_id, community_id, product_id, content_type, draft_text, status, created_at, reviewed_at"
      )
      .order("created_at", { ascending: false }),
    supabase
      .from("communities")
      .select("id, platform, name, display_name")
      .order("name"),
    supabase
      .from("products")
      .select("id, name")
      .eq("status", "active")
      .order("name"),
  ]);

  return (
    <div>
      <h1 className="text-[32px] font-semibold tracking-[-0.03em] leading-[1.2] text-text-primary">
        Queue
      </h1>
      <p className="mt-2 text-sm text-text-secondary">
        Review, edit, and approve drafted content before publishing.
      </p>

      {queueRes.error ? (
        <p className="mt-8 text-sm text-error">Failed to load queue.</p>
      ) : (
        <QueueList
          initialItems={queueRes.data ?? []}
          communities={communitiesRes.data ?? []}
          products={productsRes.data ?? []}
        />
      )}
    </div>
  );
}
