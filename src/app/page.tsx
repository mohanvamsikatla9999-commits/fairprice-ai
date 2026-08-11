import { prisma } from "@/lib/db";
import { ListingGrid } from "@/components/marketplace/listing-grid";
import { MarketplaceHomeClient } from "@/components/home/marketplace-home";
import { INDIA_CITIES } from "@/config/india-cities";
import Link from "next/link";

export const dynamic = "force-dynamic";

async function loadListings(opts: {
  featured?: boolean;
  city?: string;
  take?: number;
  orderBy?: "newest" | "views";
}) {
  return prisma.listing.findMany({
    where: {
      status: "ACTIVE",
      deletedAt: null,
      ...(opts.featured ? { OR: [{ isFeatured: true }, { isBoosted: true }] } : {}),
      ...(opts.city ? { city: { equals: opts.city, mode: "insensitive" } } : {}),
    },
    orderBy:
      opts.orderBy === "views"
        ? { views: "desc" }
        : [{ isFeatured: "desc" }, { publishedAt: "desc" }],
    take: opts.take ?? 8,
    include: {
      images: { where: { isPrimary: true }, take: 1 },
      category: { select: { name: true } },
    },
  });
}

function toCards(
  rows: Awaited<ReturnType<typeof loadListings>>,
) {
  return rows.map((item) => ({
    id: item.id,
    title: item.title,
    price: item.priceInr,
    imageUrl: item.images[0]?.url ?? "/placeholders/product.svg",
    condition: item.conditionGrade.replaceAll("_", " "),
    location: [item.area, item.city].filter(Boolean).join(", ") || "India",
    href: `/product/${item.id}`,
    featured: item.isFeatured || item.isBoosted,
  }));
}

export default async function HomePage() {
  const categories = await prisma.category.findMany({
    where: { isActive: true, parentId: null },
    orderBy: { sortOrder: "asc" },
    take: 12,
  });

  const [featured, recent, nearby] = await Promise.all([
    loadListings({ featured: true, take: 8 }),
    loadListings({ orderBy: "newest", take: 12 }),
    loadListings({ city: "Hyderabad", take: 8 }),
  ]);

  const popularSearches = [
    "iPhone 15",
    "Royal Enfield",
    "sofa",
    "laptop",
    "Activa",
    "2BHK",
  ];

  return (
    <div className="pb-16">
      <MarketplaceHomeClient
        categories={categories.map((c) => ({
          name: c.name,
          slug: c.slug,
          icon: c.icon,
        }))}
        popularSearches={popularSearches}
        cities={INDIA_CITIES.slice(0, 8).map((c) => ({
          name: c.name,
          slug: c.slug,
        }))}
      />

      <section className="container-page mt-10">
        <div className="mb-4 flex items-end justify-between gap-3">
          <h2 className="font-display text-2xl font-bold">Featured listings</h2>
          <Link href="/marketplace?sort=featured" className="text-sm text-primary hover:underline">
            See all
          </Link>
        </div>
        <ListingGrid
          listings={toCards(featured)}
          emptyMessage="No featured listings yet. Be the first to sell."
        />
      </section>

      <section className="container-page mt-12">
        <div className="mb-4 flex items-end justify-between gap-3">
          <h2 className="font-display text-2xl font-bold">Fresh picks</h2>
          <Link href="/marketplace?sort=newest" className="text-sm text-primary hover:underline">
            Newest
          </Link>
        </div>
        <ListingGrid
          listings={toCards(recent)}
          emptyMessage="No recent listings. Publish something today."
        />
      </section>

      <section className="container-page mt-12">
        <div className="mb-4 flex items-end justify-between gap-3">
          <h2 className="font-display text-2xl font-bold">Near Hyderabad</h2>
          <Link
            href="/marketplace?city=Hyderabad"
            className="text-sm text-primary hover:underline"
          >
            Change city in search
          </Link>
        </div>
        <ListingGrid
          listings={toCards(nearby)}
          emptyMessage="No nearby listings yet."
        />
      </section>

      <section className="container-page mt-14 rounded-3xl bg-primary px-6 py-10 text-primary-foreground md:px-10">
        <h2 className="font-display text-3xl font-bold">Sell in minutes</h2>
        <p className="mt-2 max-w-xl text-primary-foreground/85">
          Post photos, set a price, and reach local buyers. FairPrice AI valuations
          stay optional — add them anytime from your listing.
        </p>
        <Link
          href="/sell"
          className="mt-6 inline-flex rounded-full bg-white px-6 py-3 text-sm font-semibold text-primary"
        >
          Start selling
        </Link>
      </section>
    </div>
  );
}
