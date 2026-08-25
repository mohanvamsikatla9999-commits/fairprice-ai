"use client";

import * as React from "react";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageHero } from "@/components/layout/page-hero";
import { ListingGrid } from "@/components/marketplace/listing-grid";
import {
  FilterSidebar,
  type FilterSidebarValues,
} from "@/components/marketplace/filter-sidebar";
import { SortDropdown, type SortOption } from "@/components/marketplace/sort-dropdown";
import { SearchBar } from "@/components/marketplace/search-bar";
import {
  CityPicker,
  loadSavedCity,
} from "@/components/marketplace/city-picker";
import type { IndiaCity } from "@/config/india-cities";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { Button } from "@/components/ui/button";

type ListingItem = {
  id: string;
  title: string;
  priceInr: number;
  conditionGrade: string;
  city: string | null;
  state: string | null;
  distanceKm?: number;
  isFeatured?: boolean;
  isBoosted?: boolean;
  images: Array<{ url: string; alt: string | null }>;
};

function MarketplaceInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [items, setItems] = React.useState<ListingItem[]>([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [view, setView] = React.useState<"list" | "map">("list");
  const [city, setCity] = React.useState<IndiaCity | null>(null);
  const [radiusKm, setRadiusKm] = React.useState("25");
  const [q, setQ] = React.useState(searchParams.get("q") ?? "");
  const [sort, setSort] = React.useState<SortOption>(
    (searchParams.get("sort") as SortOption) || "newest",
  );
  const [filters, setFilters] = React.useState<FilterSidebarValues>({
    minPrice: searchParams.get("minPrice") ?? "",
    maxPrice: searchParams.get("maxPrice") ?? "",
    conditions: [],
    fairOnly: false,
    verifiedOnly: false,
  });
  const category = searchParams.get("category") ?? "";

  React.useEffect(() => {
    setCity(loadSavedCity());
  }, []);

  const load = React.useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    params.set(
      "sort",
      sort === "fair_first" ? "relevance" : city ? "distance" : sort,
    );
    if (category) params.set("category", category);
    if (filters.minPrice) params.set("minPrice", filters.minPrice);
    if (filters.maxPrice) params.set("maxPrice", filters.maxPrice);
    if (city) {
      params.set("city", city.name);
      params.set("lat", String(city.lat));
      params.set("lng", String(city.lng));
      params.set("radiusKm", radiusKm);
    }
    const res = await fetch(`/api/search?${params.toString()}`);
    const json = await res.json();
    if (json.ok) {
      setItems(json.data.items);
      setTotal(json.data.total);
    }
    setLoading(false);
  }, [q, sort, category, filters.minPrice, filters.maxPrice, city, radiusKm]);

  React.useEffect(() => {
    void load();
  }, [load]);

  return (
    <>
      <PageHero
        eyebrow="Marketplace"
        title="Browse fair-priced listings near you"
        description="Pick your city, check FairPrice, and buy or sell with confidence."
      >
        <div className="flex max-w-2xl flex-col gap-3 sm:flex-row sm:items-center">
          <CityPicker value={city} onChange={setCity} />
          {city ? (
            <select
              className="h-10 rounded-full border border-border bg-white px-3 text-sm"
              value={radiusKm}
              onChange={(e) => setRadiusKm(e.target.value)}
            >
              <option value="5">Within 5 km</option>
              <option value="10">Within 10 km</option>
              <option value="25">Within 25 km</option>
              <option value="50">Within 50 km</option>
            </select>
          ) : null}
          <div className="min-w-0 flex-1">
            <SearchBar
              defaultValue={q}
              onSearch={(query) => {
                setQ(query);
                const p = new URLSearchParams(searchParams.toString());
                if (query) p.set("q", query);
                else p.delete("q");
                router.push(`/marketplace?${p.toString()}`);
              }}
            />
          </div>
        </div>
      </PageHero>

      {/* Category pill bar */}
      <div className="border-b border-border bg-white">
        <div className="container-page flex gap-2 overflow-x-auto py-3 scrollbar-none">
          {[
            { label: "All", slug: "" },
            { label: "📱 Mobiles", slug: "mobiles" },
            { label: "💻 Laptops", slug: "laptops" },
            { label: "📺 TVs", slug: "tvs" },
            { label: "🚗 Cars", slug: "cars" },
            { label: "🛋️ Furniture", slug: "furniture" },
            { label: "👗 Fashion", slug: "fashion" },
            { label: "🎮 Gaming", slug: "gaming" },
            { label: "📷 Cameras", slug: "cameras" },
          ].map((cat) => (
            <button
              key={cat.slug}
              type="button"
              onClick={() => {
                const p = new URLSearchParams(searchParams.toString());
                if (cat.slug) p.set("category", cat.slug);
                else p.delete("category");
                router.push(`/marketplace?${p.toString()}`);
              }}
              className={`shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                category === cat.slug
                  ? "border-primary bg-primary text-white"
                  : "border-border bg-white text-foreground hover:border-primary/40"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <div className="container-page grid gap-8 py-10 lg:grid-cols-[280px_1fr]">
        <FilterSidebar
          value={filters}
          onChange={setFilters}
          onApply={(v) => {
            setFilters(v);
            void load();
          }}
          onReset={() =>
            setFilters({
              minPrice: "",
              maxPrice: "",
              conditions: [],
              fairOnly: false,
              verifiedOnly: false,
            })
          }
        />

        <div>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-foreground-muted">
              {loading
                ? "Searching…"
                : `${total} listings${city ? ` near ${city.name}` : ""}`}
            </p>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant={view === "list" ? "lime" : "outline"}
                onClick={() => setView("list")}
              >
                List
              </Button>
              <Button
                size="sm"
                variant={view === "map" ? "lime" : "outline"}
                onClick={() => setView("map")}
              >
                Map
              </Button>
              <SortDropdown value={sort} onChange={setSort} />
            </div>
          </div>

          {view === "map" ? (
            <div className="mb-6 overflow-hidden rounded-2xl border border-border shadow-sm">
              {city ? (
                <div className="relative">
                  <iframe
                    title="Listings map"
                    width="100%"
                    height="420"
                    loading="lazy"
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${city.lng - 0.15}%2C${city.lat - 0.1}%2C${city.lng + 0.15}%2C${city.lat + 0.1}&layer=mapnik&marker=${city.lat}%2C${city.lng}`}
                    className="w-full border-0"
                    allowFullScreen
                  />
                  {/* Listing pins overlay */}
                  <div className="border-t border-border bg-white p-4">
                    <p className="mb-2 text-sm font-semibold">
                      {items.length} listings near {city.name}
                    </p>
                    <ul className="grid gap-2 sm:grid-cols-2">
                      {items.slice(0, 6).map((item) => (
                        <li key={item.id}>
                          <a
                            href={`/product/${item.id}`}
                            className="flex items-center justify-between rounded-xl border border-border/60 bg-white px-3 py-2 text-sm hover:border-primary/40 hover:bg-primary/3"
                          >
                            <span className="line-clamp-1 font-medium">{item.title}</span>
                            {item.distanceKm != null && (
                              <span className="ml-2 shrink-0 text-xs text-foreground-muted">
                                {item.distanceKm.toFixed(1)} km
                              </span>
                            )}
                          </a>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-2 text-xs text-foreground-muted">
                      Powered by OpenStreetMap · Switch to list view for full details
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 bg-secondary/30 p-10 text-center">
                  <p className="font-semibold">Select a city to see listings on the map</p>
                  <p className="text-sm text-foreground-muted">
                    Use the city picker above to explore listings near you
                  </p>
                </div>
              )}
            </div>
          ) : null}

          {loading ? (
            <LoadingSkeleton />
          ) : items.length === 0 ? (
            <EmptyState
              title="No listings yet"
              description="Only real user posts appear here. Be the first to sell something nearby."
              actionLabel="Start selling"
              onAction={() => router.push("/sell")}
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
                  [
                    item.distanceKm != null
                      ? `${item.distanceKm.toFixed(1)} km`
                      : null,
                    item.city,
                    item.state,
                  ]
                    .filter(Boolean)
                    .join(" · ") || "India",
                href: `/product/${item.id}`,
                featured: item.isFeatured || item.isBoosted,
              }))}
            />
          )}
        </div>
      </div>
    </>
  );
}

export default function MarketplacePage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <MarketplaceInner />
    </Suspense>
  );
}
