import { createClient } from "@/lib/supabase/server";
import { DiscoveredList } from "./discovered-list";

export default async function DiscoveredPage() {
  const supabase = await createClient();

  const [threadsRes, communitiesRes, productsRes] = await Promise.all([
    supabase
      .from("discovered_threads")
      .select(
        "id, community_id, platform, external_id, title, url, author, body_preview, discovered_at, status"
      )
      .order("discovered_at", { ascending: false })
      .limit(100),
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
        Discovered
      </h1>
      <p className="mt-2 text-sm text-text-secondary">
        Threads and posts found by scanning. Draft a reply to move items to the
        queue.
      </p>

      {threadsRes.error ? (
        <p className="mt-8 text-sm text-error">
          Failed to load discovered threads.
        </p>
      ) : (
        <DiscoveredList
          initialThreads={threadsRes.data ?? []}
          communities={communitiesRes.data ?? []}
          products={productsRes.data ?? []}
        />
      )}
    </div>
  );
}
