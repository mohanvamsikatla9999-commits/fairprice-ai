"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { PageHero } from "@/components/layout/page-hero";
import { ListingGrid } from "@/components/marketplace/listing-grid";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { categories } from "@/config/site";

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const category = categories.find((c) => c.slug === slug);
  const [items, setItems] = React.useState<
    Array<{
      id: string;
      title: string;
      priceInr: number;
      conditionGrade: string;
      city: string | null;
      state: string | null;
      images: Array<{ url: string }>;
    }>
  >([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    (async () => {
      setLoading(true);
      const res = await fetch(`/api/search?category=${slug}&sort=newest`);
      const json = await res.json();
      if (json.ok) setItems(json.data.items);
      setLoading(false);
    })();
  }, [slug]);

  return (
    <>
      <PageHero
        eyebrow="Category"
        title={category?.name ?? slug}
        description={
          category?.description ??
          "Browse listings with FairPrice AI price intelligence."
        }
      />
      <div className="container-page py-10">
        {loading ? (
          <LoadingSkeleton />
        ) : items.length === 0 ? (
          <EmptyState
            title="No listings in this category yet"
            description="Be the first to sell with a fair AI-backed price."
            actionLabel="Sell an item"
            onAction={() => {
              window.location.href = "/sell";
            }}
          />
        ) : (
          <ListingGrid
            listings={items.map((item) => ({
              id: item.id,
              title: item.title,
              price: item.priceInr,
              imageUrl: item.images[0]?.url ?? "/placeholder-listing.svg",
              condition: item.conditionGrade.replaceAll("_", " "),
              location:
                [item.city, item.state].filter(Boolean).join(", ") || "India",
              href: `/product/${item.id}`,
            }))}
          />
        )}
      </div>
    </>
  );
}
