import Link from "next/link";
import { notFound } from "next/navigation";
import { findCityBySlug } from "@/config/india-cities";
import { searchService } from "@/services/search/service";
import { prisma } from "@/lib/db";
import { ListingGrid } from "@/components/marketplace/listing-grid";
import type { Metadata } from "next";

type Props = { params: Promise<{ city: string; category: string }> };

/** Render on demand so build does not require a live DB. */
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city: citySlug, category: categorySlug } = await params;
  const city = findCityBySlug(citySlug);
  const category = await prisma.category.findFirst({
    where: { slug: categorySlug, isActive: true },
  });
  if (!city || !category) return { title: "FairPrice AI" };
  return {
    title: `${category.name} in ${city.name} | FairPrice AI`,
    description: `Buy and sell used ${category.name.toLowerCase()} in ${city.name} with FairPrice AI valuations.`,
  };
}

export default async function CityCategoryPage({ params }: Props) {
  const { city: citySlug, category: categorySlug } = await params;
  const city = findCityBySlug(citySlug);
  const category = await prisma.category.findFirst({
    where: { slug: categorySlug, isActive: true },
  });
  if (!city || !category) notFound();

  const result = await searchService.search({
    categorySlug: category.slug,
    city: city.name,
    lat: city.lat,
    lng: city.lng,
    radiusKm: 40,
    sort: "distance",
    pageSize: 24,
  });

  return (
    <div className="container-page py-10">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
        {city.name} · {city.state}
      </p>
      <h1 className="mt-2 font-display text-3xl font-bold md:text-4xl">
        {category.name} in {city.name}
      </h1>
      <p className="mt-2 max-w-2xl text-foreground-muted">
        Local deals with FairPrice AI so you know what it&apos;s worth before you
        chat.
      </p>
      <div className="mt-4 flex flex-wrap gap-2 text-sm">
        <Link href="/marketplace" className="text-primary hover:underline">
          All marketplace
        </Link>
        <span className="text-foreground-muted">·</span>
        <Link
          href={`/category/${category.slug}`}
          className="text-primary hover:underline"
        >
          All {category.name}
        </Link>
        <span className="text-foreground-muted">·</span>
        <Link href="/sell" className="text-primary hover:underline">
          Sell in {city.name}
        </Link>
      </div>

      <div className="mt-8">
        <p className="mb-4 text-sm text-foreground-muted">
          {result.total} listings near {city.name}
        </p>
        <ListingGrid
          listings={result.items.map((item) => ({
            id: item.id,
            title: item.title,
            price: item.priceInr,
            imageUrl: item.images[0]?.url ?? "/placeholder-listing.svg",
            condition: item.conditionGrade.replaceAll("_", " "),
            location:
              [
                item.distanceKm != null ? `${item.distanceKm.toFixed(1)} km` : null,
                item.city,
              ]
                .filter(Boolean)
                .join(" · ") || city.name,
            href: `/product/${item.id}`,
            featured: item.isFeatured || item.isBoosted,
          }))}
          emptyMessage={`No ${category.name.toLowerCase()} listings near ${city.name} yet. Be the first to sell.`}
        />
      </div>
    </div>
  );
}
