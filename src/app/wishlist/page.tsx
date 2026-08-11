"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { PageHero } from "@/components/layout/page-hero";
import { ListingGrid } from "@/components/marketplace/listing-grid";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { EmptyState } from "@/components/shared/empty-state";

export default function WishlistPage() {
  const router = useRouter();
  const [items, setItems] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    (async () => {
      const res = await fetch("/api/favorites");
      if (res.status === 401) {
        router.push("/login?next=/wishlist");
        return;
      }
      const json = await res.json();
      if (json.ok) setItems(json.data.items);
      setLoading(false);
    })();
  }, [router]);

  return (
    <>
      <PageHero eyebrow="Buyer" title="Wishlist" description="Listings you saved for later." />
      <div className="container-page py-10">
        {loading ? (
          <LoadingSkeleton />
        ) : items.length === 0 ? (
          <EmptyState
            title="No saved listings"
            description="Tap Save on a product page to add it here."
            actionLabel="Browse marketplace"
            onAction={() => router.push("/marketplace")}
          />
        ) : (
          <ListingGrid
            listings={items.map((f) => ({
              id: f.listing.id,
              title: f.listing.title,
              price: f.listing.priceInr,
              imageUrl: f.listing.images?.[0]?.url ?? "/placeholder-listing.svg",
              condition: String(f.listing.conditionGrade ?? "GOOD").replaceAll("_", " "),
              location: [f.listing.city, f.listing.state].filter(Boolean).join(", ") || "India",
              href: `/product/${f.listing.id}`,
            }))}
          />
        )}
      </div>
    </>
  );
}
