"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { PageHero } from "@/components/layout/page-hero";
import { SearchBar } from "@/components/marketplace/search-bar";
import { ListingGrid } from "@/components/marketplace/listing-grid";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";

export default function SearchPage() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [filters, setFilters] = React.useState<Record<string, unknown> | null>(null);
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
  const [total, setTotal] = React.useState(0);

  async function runSearch(query: string) {
    if (!query.trim()) return;
    setLoading(true);
    const res = await fetch("/api/ai/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });
    const json = await res.json();
    setLoading(false);
    if (!json.ok) return;
    setFilters(json.data.filters);
    setItems(json.data.items);
    setTotal(json.data.total);
  }

  return (
    <>
      <PageHero
        eyebrow="AI Search"
        title="Describe what you want in plain English"
        description='Try “iPhone 13 under 35k in Bengaluru” or “good condition sofa near Pune”.'
      >
        <div className="max-w-2xl">
          <SearchBar
            size="lg"
            placeholder="iPhone 13 under ₹35,000 in Bengaluru"
            onSearch={(q) => void runSearch(q)}
          />
        </div>
      </PageHero>
      <div className="container-page py-10">
        {filters ? (
          <div className="mb-6 flex flex-wrap gap-2">
            {Object.entries(filters)
              .filter(([, v]) => v !== undefined && v !== null && v !== "")
              .map(([k, v]) => (
                <Badge key={k} variant="soft">
                  {k}: {String(v)}
                </Badge>
              ))}
            <p className="w-full text-sm text-foreground-muted">{total} matches</p>
          </div>
        ) : null}
        {loading ? (
          <LoadingSkeleton />
        ) : items.length === 0 ? (
          <EmptyState
            title="Ask FairPrice AI"
            description="Natural language search understands price, city, and condition."
            actionLabel="Browse marketplace"
            onAction={() => router.push("/marketplace")}
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
