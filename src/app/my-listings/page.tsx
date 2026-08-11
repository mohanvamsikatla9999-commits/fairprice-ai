"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatInr } from "@/lib/utils";

type ListingRow = {
  id: string;
  title: string;
  priceInr: number;
  status: string;
  views: number;
  favoriteCount: number;
  city: string | null;
  publishedAt: string | null;
  _count?: { conversations: number; offers: number };
};

const TABS = ["ACTIVE", "PENDING_REVIEW", "DRAFT", "SOLD", "EXPIRED", "PAUSED"] as const;

export default function MyListingsPage() {
  const [items, setItems] = React.useState<ListingRow[]>([]);
  const [tab, setTab] = React.useState<(typeof TABS)[number]>("ACTIVE");
  const [error, setError] = React.useState<string | null>(null);
  const [busyId, setBusyId] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    const res = await fetch("/api/listings?mine=1");
    const json = await res.json();
    if (!res.ok) {
      setError(json.error?.message ?? "Failed to load listings");
      return;
    }
    setItems(json.data?.items ?? []);
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const filtered = items.filter((i) => i.status === tab);

  async function markSold(id: string) {
    if (!confirm("Mark this listing as sold?")) return;
    setBusyId(id);
    try {
      const res = await fetch(`/api/listings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "SOLD" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message ?? "Update failed");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    } finally {
      setBusyId(null);
    }
  }

  async function removeListing(id: string) {
    if (!confirm("Delete this listing? This cannot be undone easily.")) return;
    setBusyId(id);
    try {
      const res = await fetch(`/api/listings/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message ?? "Delete failed");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="container-page py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">My listings</h1>
          <p className="mt-1 text-foreground-muted">
            Manage active ads, drafts, and sold items.
          </p>
        </div>
        <Button asChild>
          <Link href="/sell">Post new</Link>
        </Button>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-full px-4 py-2 text-sm ${
              tab === t
                ? "bg-primary text-primary-foreground"
                : "border border-border bg-white"
            }`}
          >
            {t.replaceAll("_", " ")} (
            {items.filter((i) => i.status === t).length})
          </button>
        ))}
      </div>

      {error ? (
        <p className="mt-4 text-sm text-destructive">{error}</p>
      ) : null}

      <div className="mt-6 space-y-3">
        {filtered.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border p-8 text-center text-foreground-muted">
            No listings in this tab.
          </p>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-white p-4"
            >
              <div>
                <Link
                  href={`/product/${item.id}`}
                  className="font-medium hover:text-primary"
                >
                  {item.title}
                </Link>
                <p className="text-sm text-foreground-muted">
                  {formatInr(item.priceInr)} · {item.city ?? "—"} · {item.views}{" "}
                  views · {item.favoriteCount} favourites
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" asChild>
                  <Link href={`/my-listings/${item.id}/edit`}>Edit</Link>
                </Button>
                {item.status === "ACTIVE" ? (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busyId === item.id}
                    onClick={() => void markSold(item.id)}
                  >
                    Mark sold
                  </Button>
                ) : null}
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={busyId === item.id}
                  onClick={() => void removeListing(item.id)}
                >
                  Delete
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    void navigator.clipboard.writeText(
                      `${window.location.origin}/product/${item.id}`,
                    );
                  }}
                >
                  Share
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
