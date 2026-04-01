export default function ProductsPage() {
  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[32px] font-semibold tracking-[-0.03em] leading-[1.2] text-text-primary">
            Products
          </h1>
          <p className="mt-2 text-sm text-text-secondary">
            Apps and projects being promoted across social platforms.
          </p>
        </div>
      </div>

      <div className="mt-8">
        <p className="text-sm text-text-tertiary">No products added yet.</p>
      </div>
    </div>
  );
}
