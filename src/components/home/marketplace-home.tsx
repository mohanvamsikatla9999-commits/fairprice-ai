"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CityPicker, loadSavedCity } from "@/components/marketplace/city-picker";
import type { IndiaCity } from "@/config/india-cities";

type Props = {
  categories: Array<{ name: string; slug: string; icon: string | null }>;
  popularSearches: string[];
  cities: Array<{ name: string; slug: string }>;
};

export function MarketplaceHomeClient({
  categories,
  popularSearches,
  cities,
}: Props) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [city, setCity] = React.useState<IndiaCity | null>(null);

  React.useEffect(() => {
    setCity(loadSavedCity());
  }, []);

  function submit(e?: React.FormEvent) {
    e?.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (city?.name) params.set("city", city.name);
    router.push(`/marketplace?${params.toString()}`);
  }

  return (
    <section className="border-b border-border bg-gradient-to-b from-background-muted to-background">
      <div className="container-page py-10 md:py-14">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          FairPrice AI Marketplace
        </p>
        <h1 className="mt-2 max-w-3xl font-display text-4xl font-bold tracking-tight md:text-5xl">
          Buy &amp; sell locally
        </h1>
        <p className="mt-3 max-w-2xl text-foreground-muted">
          Browse real listings near you. Search by product, brand, category, or city.
        </p>

        <form
          onSubmit={submit}
          className="mt-8 flex flex-col gap-3 rounded-2xl border border-border bg-white p-3 shadow-sm md:flex-row md:items-center"
        >
          <CityPicker value={city} onChange={setCity} compact className="md:w-48" />
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-muted" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder='Try "iPhone 15", "sofa", "Royal Enfield"…'
              className="h-11 border-0 bg-transparent pl-10 shadow-none focus-visible:ring-0"
              aria-label="Search marketplace"
            />
          </div>
          <Button type="submit" className="h-11 px-6">
            Search
          </Button>
        </form>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="text-xs text-foreground-muted">Popular:</span>
          {popularSearches.map((term) => (
            <Link
              key={term}
              href={`/marketplace?q=${encodeURIComponent(term)}`}
              className="rounded-full border border-border px-3 py-1 text-xs hover:border-primary/40"
            >
              {term}
            </Link>
          ))}
        </div>

        <div className="mt-10">
          <h2 className="font-display text-xl font-semibold">Browse categories</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/category/${cat.slug}`}
                className="rounded-2xl border border-border bg-white px-3 py-4 text-center text-sm font-medium transition hover:border-primary/40 hover:shadow-sm"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-8">
          <h2 className="font-display text-xl font-semibold">Popular locations</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {cities.map((c) => (
              <Link
                key={c.slug}
                href={`/in/${c.slug}`}
                className="rounded-full bg-background-muted px-4 py-2 text-sm hover:bg-primary/10"
              >
                {c.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
