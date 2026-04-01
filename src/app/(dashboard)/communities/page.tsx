import { createClient } from "@/lib/supabase/server";
import { CommunityList } from "./community-list";

export default async function CommunitiesPage() {
  const supabase = await createClient();

  const [communitiesRes, productsRes, linksRes] = await Promise.all([
    supabase
      .from("communities")
      .select("id, platform, name, display_name, keywords, rules_notes, scan_enabled, created_at, updated_at")
      .order("platform")
      .order("name"),
    supabase
      .from("products")
      .select("id, name")
      .eq("status", "active")
      .order("name"),
    supabase
      .from("product_communities")
      .select("id, product_id, community_id"),
  ]);

  return (
    <div>
      <h1 className="text-[32px] font-semibold tracking-[-0.03em] leading-[1.2] text-text-primary">
        Communities
      </h1>
      <p className="mt-2 text-sm text-text-secondary">
        Manage tracked subreddits and X accounts.
      </p>

      {communitiesRes.error ? (
        <p className="mt-8 text-sm text-error">Failed to load communities.</p>
      ) : (
        <CommunityList
          initialCommunities={communitiesRes.data ?? []}
          products={productsRes.data ?? []}
          initialLinks={linksRes.data ?? []}
        />
      )}
    </div>
  );
}
