import Link from "next/link";
import { notFound } from "next/navigation";
import { findCityBySlug } from "@/config/india-cities";
import { prisma } from "@/lib/db";
import type { Metadata } from "next";

type Props = { params: Promise<{ city: string }> };

/** Render on demand so build does not require a live DB. */
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city: citySlug } = await params;
  const city = findCityBySlug(citySlug);
  if (!city) return { title: "FairPrice AI" };
  return {
    title: `Buy & sell in ${city.name} | FairPrice AI`,
    description: `India's AI-powered resale marketplace in ${city.name}. Know what it's worth.`,
  };
}

export default async function CityHubPage({ params }: Props) {
  const { city: citySlug } = await params;
  const city = findCityBySlug(citySlug);
  if (!city) notFound();

  const categories = await prisma.category.findMany({
    where: { isActive: true, parentId: null },
    orderBy: { sortOrder: "asc" },
    take: 24,
  });

  return (
    <div className="container-page py-12">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
        Local marketplace
      </p>
      <h1 className="mt-2 font-display text-4xl font-bold">
        FairPrice in {city.name}
      </h1>
      <p className="mt-3 max-w-xl text-foreground-muted">
        Browse categories near you. Every listing can show a FairPrice band so
        deals stay transparent.
      </p>
      <div className="mt-8 grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/in/${city.slug}/${cat.slug}`}
            className="rounded-2xl border border-border bg-white px-4 py-5 font-medium transition hover:border-primary/40 hover:shadow-sm"
          >
            {cat.name}
          </Link>
        ))}
      </div>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href={`/marketplace?city=${encodeURIComponent(city.name)}`}
          className="text-sm text-primary hover:underline"
        >
          Open full marketplace
        </Link>
        <Link href="/sell" className="text-sm text-primary hover:underline">
          Sell in {city.name}
        </Link>
      </div>
    </div>
  );
}
