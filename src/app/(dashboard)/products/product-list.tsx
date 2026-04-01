"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/types";
import { Plus, ExternalLink, Pencil, Archive, RotateCcw } from "lucide-react";

type Product = Tables<"products">;

const statusColors: Record<string, string> = {
  active: "bg-success-muted text-[#22C55E]",
  planned: "bg-warning-muted text-[#F59E0B]",
  archived: "bg-[rgba(255,255,255,0.06)] text-text-tertiary",
};

export function ProductList({ initialProducts }: { initialProducts: Product[] }) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<string>("active");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  function resetForm() {
    setName("");
    setUrl("");
    setDescription("");
    setStatus("active");
    setEditingId(null);
    setShowForm(false);
    setError(null);
  }

  function startEdit(p: Product) {
    setName(p.name);
    setUrl(p.url ?? "");
    setDescription(p.description ?? "");
    setStatus(p.status);
    setEditingId(p.id);
    setShowForm(true);
  }

  async function handleSave() {
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    setSaving(true);
    setError(null);

    const payload = {
      name: name.trim(),
      url: url.trim() || null,
      description: description.trim() || null,
      status,
    };

    if (editingId) {
      const { data, error: err } = await supabase
        .from("products")
        .update(payload)
        .eq("id", editingId)
        .select("id, name, url, description, status, created_at, updated_at")
        .single();

      if (err) {
        setError(err.message);
        setSaving(false);
        return;
      }
      setProducts((prev) =>
        prev.map((p) => (p.id === editingId ? data : p))
      );
    } else {
      const { data, error: err } = await supabase
        .from("products")
        .insert(payload)
        .select("id, name, url, description, status, created_at, updated_at")
        .single();

      if (err) {
        setError(err.message);
        setSaving(false);
        return;
      }
      setProducts((prev) => [data, ...prev]);
    }

    setSaving(false);
    resetForm();
    router.refresh();
  }

  async function toggleArchive(p: Product) {
    const newStatus = p.status === "archived" ? "active" : "archived";
    const { error: err } = await supabase
      .from("products")
      .update({ status: newStatus })
      .eq("id", p.id);

    if (!err) {
      setProducts((prev) =>
        prev.map((item) =>
          item.id === p.id ? { ...item, status: newStatus } : item
        )
      );
      router.refresh();
    }
  }

  return (
    <div className="mt-8">
      {/* Add button */}
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-[#09090B] hover:bg-accent-hover active:opacity-80 transition-colors duration-150"
        >
          <Plus className="h-4 w-4" />
          Add Product
        </button>
      )}

      {/* Form */}
      {showForm && (
        <div className="rounded-md border border-border-default bg-bg-raised p-4 space-y-4">
          <h3 className="text-sm font-medium text-text-primary">
            {editingId ? "Edit Product" : "New Product"}
          </h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">
                Name *
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="PointsForecast"
                className="block w-full rounded-md border border-border-default bg-bg-base px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:border-border-strong focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">
                URL
              </label>
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://pointsforecast.com"
                className="block w-full rounded-md border border-border-default bg-bg-base px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:border-border-strong focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="What this product does..."
              className="block w-full rounded-md border border-border-default bg-bg-base px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:border-border-strong focus:outline-none focus:ring-1 focus:ring-accent resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="block w-full rounded-md border border-border-default bg-bg-base px-3 py-2 text-sm text-text-primary focus:border-border-strong focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="active">Active</option>
              <option value="planned">Planned</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          {error && <p className="text-xs text-error">{error}</p>}

          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-[#09090B] hover:bg-accent-hover disabled:opacity-40 transition-colors duration-150"
            >
              {saving ? "Saving…" : editingId ? "Update" : "Create"}
            </button>
            <button
              onClick={resetForm}
              className="rounded-md border border-border-default px-4 py-2 text-sm text-text-primary hover:bg-[rgba(255,255,255,0.04)] transition-colors duration-150"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Product list */}
      <div className="mt-6 space-y-2">
        {products.length === 0 && !showForm && (
          <p className="text-sm text-text-tertiary">No products yet. Add one to get started.</p>
        )}
        {products.map((p) => (
          <div
            key={p.id}
            className="flex items-center justify-between rounded-md border border-border-subtle bg-bg-raised px-4 py-3 hover:bg-[rgba(255,255,255,0.04)] transition-colors duration-150"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span
                className={`shrink-0 rounded px-2 py-0.5 text-[11px] font-medium uppercase tracking-[0.04em] ${
                  statusColors[p.status] ?? statusColors.active
                }`}
              >
                {p.status}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">
                  {p.name}
                </p>
                {p.description && (
                  <p className="text-xs text-text-tertiary truncate mt-0.5">
                    {p.description}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0 ml-4">
              {p.url && (
                <a
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded p-1.5 text-text-tertiary hover:text-text-secondary hover:bg-[rgba(255,255,255,0.04)] transition-colors"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
              <button
                onClick={() => startEdit(p)}
                className="rounded p-1.5 text-text-tertiary hover:text-text-secondary hover:bg-[rgba(255,255,255,0.04)] transition-colors"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => toggleArchive(p)}
                className="rounded p-1.5 text-text-tertiary hover:text-text-secondary hover:bg-[rgba(255,255,255,0.04)] transition-colors"
                title={p.status === "archived" ? "Restore" : "Archive"}
              >
                {p.status === "archived" ? (
                  <RotateCcw className="h-3.5 w-3.5" />
                ) : (
                  <Archive className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
