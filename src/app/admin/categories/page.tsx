"use client";

import * as React from "react";
import { Plus, Trash2, Pencil, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Category = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  parentId: string | null;
  sortOrder: number;
  isActive: boolean;
  _count: { listings: number; children: number };
};

export default function AdminCategoriesPage() {
  const [cats, setCats] = React.useState<Category[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [editId, setEditId] = React.useState<string | null>(null);
  const [editName, setEditName] = React.useState("");
  const [editIcon, setEditIcon] = React.useState("");
  const [creating, setCreating] = React.useState(false);
  const [newName, setNewName] = React.useState("");
  const [newSlug, setNewSlug] = React.useState("");
  const [newIcon, setNewIcon] = React.useState("");
  const [busyId, setBusyId] = React.useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/admin/categories");
    const json = await res.json();
    if (json.ok) setCats(json.data.categories);
    setLoading(false);
  }

  React.useEffect(() => { void load(); }, []);

  async function saveEdit(id: string) {
    setBusyId(id);
    const res = await fetch("/api/admin/categories", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, name: editName, icon: editIcon || null }),
    });
    const json = await res.json();
    if (!json.ok) { setError(json.error?.message ?? "Update failed"); }
    else { setEditId(null); await load(); }
    setBusyId(null);
  }

  async function deleteCategory(id: string) {
    if (!confirm("Delete this category? This cannot be undone.")) return;
    setBusyId(id);
    const res = await fetch(`/api/admin/categories?id=${id}`, { method: "DELETE" });
    const json = await res.json();
    if (!json.ok) setError(json.error?.message ?? "Delete failed");
    else await load();
    setBusyId(null);
  }

  async function createCategory() {
    if (!newName.trim() || !newSlug.trim()) return;
    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim(), slug: newSlug.trim(), icon: newIcon || undefined }),
    });
    const json = await res.json();
    if (!json.ok) { setError(json.error?.message ?? "Create failed"); return; }
    setCreating(false); setNewName(""); setNewSlug(""); setNewIcon("");
    await load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Categories</h1>
          <p className="mt-1 text-sm text-foreground-muted">Manage marketplace category tree</p>
        </div>
        <Button onClick={() => setCreating(true)} disabled={creating}>
          <Plus className="h-4 w-4" /> New category
        </Button>
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error} <button onClick={() => setError(null)} className="ml-2 underline">Dismiss</button>
        </div>
      )}

      {creating && (
        <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-semibold">New category</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="text-xs font-medium">Name *</label>
              <Input className="mt-1" value={newName} onChange={(e) => {
                setNewName(e.target.value);
                setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
              }} placeholder="Mobiles" />
            </div>
            <div>
              <label className="text-xs font-medium">Slug *</label>
              <Input className="mt-1" value={newSlug} onChange={(e) => setNewSlug(e.target.value)} placeholder="mobiles" />
            </div>
            <div>
              <label className="text-xs font-medium">Icon (emoji)</label>
              <Input className="mt-1" value={newIcon} onChange={(e) => setNewIcon(e.target.value)} placeholder="📱" />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button onClick={() => void createCategory()}>Create</Button>
            <Button variant="outline" onClick={() => setCreating(false)}>Cancel</Button>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-secondary/50">
            <tr>
              {["Icon", "Name", "Slug", "Listings", "Subcats", "Active", "Actions"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-foreground-muted">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-foreground-muted">Loading…</td></tr>
            ) : cats.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-foreground-muted">No categories. Create one above.</td></tr>
            ) : cats.map((cat) => (
              <tr key={cat.id} className="hover:bg-secondary/20">
                <td className="px-4 py-3 text-lg">{cat.icon ?? "—"}</td>
                <td className="px-4 py-3">
                  {editId === cat.id ? (
                    <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-8" autoFocus />
                  ) : (
                    <span className="font-medium">{cat.name}</span>
                  )}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-foreground-muted">{cat.slug}</td>
                <td className="px-4 py-3">{cat._count.listings}</td>
                <td className="px-4 py-3">{cat._count.children}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${cat.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                    {cat.isActive ? "Active" : "Off"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {editId === cat.id ? (
                    <div className="flex gap-1">
                      <Button size="sm" variant="lime" onClick={() => void saveEdit(cat.id)} disabled={busyId === cat.id}><Check className="h-3.5 w-3.5" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditId(null)}><X className="h-3.5 w-3.5" /></Button>
                    </div>
                  ) : (
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => { setEditId(cat.id); setEditName(cat.name); setEditIcon(cat.icon ?? ""); }}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" disabled={busyId === cat.id || cat._count.listings > 0 || cat._count.children > 0} onClick={() => void deleteCategory(cat.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
