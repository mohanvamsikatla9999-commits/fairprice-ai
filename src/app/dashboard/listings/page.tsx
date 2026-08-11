"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHero } from "@/components/layout/page-hero";
import { Button } from "@/components/ui/button";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { formatInr } from "@/lib/utils";

export default function MyListingsPage() {
  const router = useRouter();
  const [items, setItems] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  async function load() {
    const res = await fetch("/api/listings?mine=1");
    if (res.status === 401) {
      router.push("/login?next=/dashboard/listings");
      return;
    }
    const json = await res.json();
    if (json.ok) setItems(json.data.items);
    setLoading(false);
  }

  React.useEffect(() => {
    void load();
  }, [router]);

  async function publish(id: string) {
    await fetch(`/api/listings/${id}/publish`, { method: "POST" });
    await load();
  }

  async function remove(id: string) {
    await fetch(`/api/listings/${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <>
      <PageHero eyebrow="Seller" title="My listings" description="Manage drafts, active posts, and sold items.">
        <Button variant="lime" asChild>
          <Link href="/sell">New listing</Link>
        </Button>
      </PageHero>
      <div className="container-page py-10">
        {loading ? (
          <LoadingSkeleton variant="lines" count={6} />
        ) : items.length === 0 ? (
          <EmptyState
            title="No listings yet"
            description="Create your first AI-priced listing."
            actionLabel="Sell an item"
            onAction={() => router.push("/sell")}
          />
        ) : (
          <div className="space-y-3">
            {items.map((l) => (
              <div
                key={l.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-white px-5 py-4"
              >
                <div>
                  <Link href={`/product/${l.id}`} className="font-medium hover:text-primary">
                    {l.title}
                  </Link>
                  <p className="text-xs text-foreground-muted">
                    {l.status} · {formatInr(l.priceInr)}
                  </p>
                </div>
                <div className="flex gap-2">
                  {l.status === "ACTIVE" ? (
                    <Button
                      size="sm"
                      variant="lime"
                      onClick={async () => {
                        await fetch("/api/listings/boost", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ listingId: l.id, type: "BOOST" }),
                        });
                        await load();
                      }}
                    >
                      Boost ₹99
                    </Button>
                  ) : null}
                  {l.status === "DRAFT" || l.status === "PENDING_REVIEW" ? (
                    <Button size="sm" variant="outline" onClick={() => void publish(l.id)}>
                      Publish
                    </Button>
                  ) : null}
                  <Button size="sm" variant="ghost" onClick={() => void remove(l.id)}>
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
