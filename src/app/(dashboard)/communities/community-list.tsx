"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/types";
import { Plus, Pencil, Eye, EyeOff } from "lucide-react";

type Community = Tables<"communities">;
type ProductRef = { id: string; name: string };

const platformIcons: Record<string, string> = {
  reddit: "🔴",
  x: "𝕏",
};

export function CommunityList({
  initialCommunities,
  products,
}: {
  initialCommunities: Community[];
  products: ProductRef[];
}) {
  const [communities, setCommunities] = useState<Community[]>(initialCommunities);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [platform, setPlatform] = useState<string>("reddit");
  const [name, setName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [keywordsInput, setKeywordsInput] = useState("");
  const [rulesNotes, setRulesNotes] = useState("");
  const [scanEnabled, setScanEnabled] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  function resetForm() {
    setPlatform("reddit");
    setName("");
    setDisplayName("");
    setKeywordsInput("");
    setRulesNotes("");
    setScanEnabled(true);
    setEditingId(null);
    setShowForm(false);
    setError(null);
  }

  function startEdit(c: Community) {
    setPlatform(c.platform);
    setName(c.name);
    setDisplayName(c.display_name ?? "");
    setKeywordsInput((c.keywords ?? []).join(", "));
    setRulesNotes(c.rules_notes ?? "");
    setScanEnabled(c.scan_enabled);
    setEditingId(c.id);
    setShowForm(true);
  }

  async function handleSave() {
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    setSaving(true);
    setError(null);

    const keywords = keywordsInput
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);

    const payload = {
      platform,
      name: name.trim(),
      display_name: displayName.trim() || null,
      keywords,
      rules_notes: rulesNotes.trim() || null,
      scan_enabled: scanEnabled,
    };

    if (editingId) {
      const { data, error: err } = await supabase
        .from("communities")
        .update(payload)
        .eq("id", editingId)
        .select("id, platform, name, display_name, keywords, rules_notes, scan_enabled, created_at, updated_at")
        .single();

      if (err) {
        setError(err.message);
        setSaving(false);
        return;
      }
      setCommunities((prev) =>
        prev.map((c) => (c.id === editingId ? data : c))
      );
    } else {
      const { data, error: err } = await supabase
        .from("communities")
        .insert(payload)
        .select("id, platform, name, display_name, keywords, rules_notes, scan_enabled, created_at, updated_at")
        .single();

      if (err) {
        setError(err.message);
        setSaving(false);
        return;
      }
      setCommunities((prev) => [...prev, data]);
    }

    setSaving(false);
    resetForm();
    router.refresh();
  }

  async function toggleScan(c: Community) {
    const { error: err } = await supabase
      .from("communities")
      .update({ scan_enabled: !c.scan_enabled })
      .eq("id", c.id);

    if (!err) {
      setCommunities((prev) =>
        prev.map((item) =>
          item.id === c.id ? { ...item, scan_enabled: !item.scan_enabled } : item
        )
      );
    }
  }

  const redditCommunities = communities.filter((c) => c.platform === "reddit");
  const xCommunities = communities.filter((c) => c.platform === "x");

  return (
    <div className="mt-8">
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-[#09090B] hover:bg-accent-hover active:opacity-80 transition-colors duration-150"
        >
          <Plus className="h-4 w-4" />
          Add Community
        </button>
      )}

      {/* Form */}
      {showForm && (
        <div className="rounded-md border border-border-default bg-bg-raised p-4 space-y-4">
          <h3 className="text-sm font-medium text-text-primary">
            {editingId ? "Edit Community" : "New Community"}
          </h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">
                Platform *
              </label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                disabled={!!editingId}
                className="block w-full rounded-md border border-border-default bg-bg-base px-3 py-2 text-sm text-text-primary focus:border-border-strong focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-50"
              >
                <option value="reddit">Reddit</option>
                <option value="x">X</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">
                Name * {platform === "reddit" ? "(subreddit, no r/)" : "(handle, no @)"}
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={platform === "reddit" ? "awardtravel" : "vibecodingdaily"}
                className="block w-full rounded-md border border-border-default bg-bg-base px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:border-border-strong focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">
                Display Name
              </label>
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Award Travel"
                className="block w-full rounded-md border border-border-default bg-bg-base px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:border-border-strong focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">
              Keywords (comma-separated)
            </label>
            <input
              value={keywordsInput}
              onChange={(e) => setKeywordsInput(e.target.value)}
              placeholder="transfer bonus, credit card points, airline miles"
              className="block w-full rounded-md border border-border-default bg-bg-base px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:border-border-strong focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">
              Rules / Notes
            </label>
            <textarea
              value={rulesNotes}
              onChange={(e) => setRulesNotes(e.target.value)}
              rows={2}
              placeholder="9:1 posting ratio, no self-promo without established history..."
              className="block w-full rounded-md border border-border-default bg-bg-base px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:border-border-strong focus:outline-none focus:ring-1 focus:ring-accent resize-none"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={scanEnabled}
              onChange={(e) => setScanEnabled(e.target.checked)}
              className="rounded border-border-default accent-accent"
            />
            <span className="text-sm text-text-secondary">Enable scanning</span>
          </label>

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

      {/* Community list grouped by platform */}
      {[
        { label: "Reddit", items: redditCommunities, prefix: "r/" },
        { label: "X", items: xCommunities, prefix: "@" },
      ].map(
        (group) =>
          group.items.length > 0 && (
            <div key={group.label} className="mt-6">
              <h3 className="text-xs font-medium uppercase tracking-[0.04em] text-text-secondary mb-2">
                {group.label}
              </h3>
              <div className="space-y-2">
                {group.items.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between rounded-md border border-border-subtle bg-bg-raised px-4 py-3 hover:bg-[rgba(255,255,255,0.04)] transition-colors duration-150"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-text-primary">
                          {group.prefix}{c.name}
                        </span>
                        {c.display_name && (
                          <span className="text-xs text-text-tertiary">
                            {c.display_name}
                          </span>
                        )}
                        {!c.scan_enabled && (
                          <span className="rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider bg-[rgba(255,255,255,0.06)] text-text-tertiary">
                            Paused
                          </span>
                        )}
                      </div>
                      {c.keywords && c.keywords.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {c.keywords.map((kw) => (
                            <span
                              key={kw}
                              className="rounded-full px-2 py-0.5 text-[11px] bg-bg-inset text-text-tertiary"
                            >
                              {kw}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0 ml-4">
                      <button
                        onClick={() => toggleScan(c)}
                        className="rounded p-1.5 text-text-tertiary hover:text-text-secondary hover:bg-[rgba(255,255,255,0.04)] transition-colors"
                        title={c.scan_enabled ? "Pause scanning" : "Enable scanning"}
                      >
                        {c.scan_enabled ? (
                          <Eye className="h-3.5 w-3.5" />
                        ) : (
                          <EyeOff className="h-3.5 w-3.5" />
                        )}
                      </button>
                      <button
                        onClick={() => startEdit(c)}
                        className="rounded p-1.5 text-text-tertiary hover:text-text-secondary hover:bg-[rgba(255,255,255,0.04)] transition-colors"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
      )}

      {communities.length === 0 && !showForm && (
        <p className="mt-6 text-sm text-text-tertiary">
          No communities added yet. Add subreddits or X accounts to track.
        </p>
      )}
    </div>
  );
}
