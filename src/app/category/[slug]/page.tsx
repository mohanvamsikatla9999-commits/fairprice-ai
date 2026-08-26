"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PageHero } from "@/components/layout/page-hero";
import { ListingGrid } from "@/components/marketplace/listing-grid";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { EmptyState } from "@/components/shared/empty-state";

type CatNode = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  children: CatNode[];
};

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const [category, setCategory] = React.useState<CatNode | null>(null);
  const [items, setItems] = React.useState<
    Array<{
      id: string;
      title: string;
      priceInr: number;
      conditionGrade: string;
      city: string | null;
      area?: string | null;
      images: Array<{ url: string }>;
      isFeatured?: boolean;
      isBoosted?: boolean;
    }>
  >([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    (async () => {
      setLoading(true);
      const [catRes, listRes] = await Promise.all([
        fetch("/api/categories"),
        fetch(`/api/search?category=${slug}&sort=newest`),
      ]);
      const catJson = await catRes.json();
      const listJson = await listRes.json();
      const roots: CatNode[] = catJson.data?.categories ?? [];
      const find = (nodes: CatNode[]): CatNode | null => {
        for (const n of nodes) {
          if (n.slug === slug) return n;
          const child = find(n.children ?? []);
          if (child) return child;
        }
        return null;
      };
      setCategory(find(roots));
      if (listJson.ok) setItems(listJson.data.items);
      setLoading(false);
    })();
  }, [slug]);

  return (
    <>
      <PageHero
        eyebrow="Category"
        title={category?.name ?? slug}
        description={
          category?.description ?? "Browse listings in this category."
        }
      />
      {category?.children?.length ? (
        <div className="container-page -mt-4 mb-6 flex flex-wrap gap-2">
          {category.children.map((child) => (
            <Link
              key={child.id}
              href={`/category/${child.slug}`}
              className="rounded-full border border-border bg-white px-4 py-2 text-sm hover:border-primary/40"
            >
              {child.name}
            </Link>
          ))}
        </div>
      ) : null}
      <div className="container-page pb-16">
        {loading ? (
          <LoadingSkeleton />
        ) : items.length === 0 ? (
          <EmptyState
            title="No listings yet"
            description="Be the first to sell in this category."
            actionLabel="Sell now"
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
              imageUrl: item.images[0]?.url ?? "/placeholders/product.svg",
              condition: item.conditionGrade.replaceAll("_", " "),
              location: [item.area, item.city].filter(Boolean).join(", ") || "India",
              href: `/product/${item.id}`,
              featured: item.isFeatured || item.isBoosted,
            }))}
          />
        )}
      </div>
    </>
  );
}
