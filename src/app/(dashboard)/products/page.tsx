import { createClient } from "@/lib/supabase/server";
import { ProductList } from "./product-list";

export default async function ProductsPage() {
  const supabase = await createClient();
  const { data: products, error } = await supabase
    .from("products")
    .select("id, name, url, description, status, created_at, updated_at")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="text-[32px] font-semibold tracking-[-0.03em] leading-[1.2] text-text-primary">
        Products
      </h1>
      <p className="mt-2 text-sm text-text-secondary">
        Apps and projects being promoted across social platforms.
      </p>

      {error ? (
        <p className="mt-8 text-sm text-error">Failed to load products.</p>
      ) : (
        <ProductList initialProducts={products ?? []} />
      )}
    </div>
  );
}
