import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { ListingGrid } from "@/components/marketplace/listing-grid";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatInr } from "@/lib/utils";
import type { Metadata } from "next";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const seller = await prisma.user.findFirst({
    where: { id, deletedAt: null },
    select: { displayName: true, name: true },
  });
  const name = seller?.displayName || seller?.name || "Seller";
  return {
    title: `${name} | FairPrice AI`,
    description: `Browse active listings from ${name} on FairPrice AI.`,
  };
}

export const dynamic = "force-dynamic";

export default async function SellerProfilePage({ params }: Props) {
  const { id } = await params;
  const seller = await prisma.user.findFirst({
    where: { id, deletedAt: null, isBlocked: false },
    include: {
      profile: true,
      businessAccount: true,
      _count: {
        select: {
          listings: { where: { status: "SOLD", deletedAt: null } },
        },
      },
    },
  });
  if (!seller) notFound();

  const listings = await prisma.listing.findMany({
    where: { sellerId: id, status: "ACTIVE", deletedAt: null },
    orderBy: { publishedAt: "desc" },
    take: 48,
    include: {
      images: { where: { isPrimary: true }, take: 1 },
    },
  });

  const name =
    seller.businessAccount?.companyName ||
    seller.displayName ||
    seller.name ||
    "Seller";

  return (
    <div className="container-page py-10">
      <div className="flex flex-wrap items-start gap-5">
        <Avatar className="h-20 w-20">
          <AvatarImage src={seller.avatarUrl ?? undefined} alt={name} />
          <AvatarFallback>{name.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="font-display text-3xl font-bold">{name}</h1>
          <p className="mt-1 text-sm text-foreground-muted">
            Member since {seller.createdAt.toLocaleDateString("en-IN")}
            {seller.profile?.city ? ` · ${seller.profile.city}` : ""}
          </p>
          <p className="mt-2 text-sm">
            Trust score {seller.sellerTrustScore} · {listings.length} active ·{" "}
            {seller._count.listings} sold
          </p>
          {seller.bio ? (
            <p className="mt-3 max-w-2xl text-foreground-muted">{seller.bio}</p>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <Link href={`/store/${id}`} className="text-primary hover:underline">
              Storefront view
            </Link>
            <Link
              href={`/report?type=USER&id=${id}`}
              className="text-foreground-muted hover:underline"
            >
              Report seller
            </Link>
          </div>
        </div>
      </div>

      <h2 className="mt-10 font-display text-2xl font-semibold">Active listings</h2>
      <div className="mt-4">
        <ListingGrid
          listings={listings.map((item) => ({
            id: item.id,
            title: item.title,
            price: item.priceInr,
            imageUrl: item.images[0]?.url ?? "/placeholders/product.svg",
            condition: item.conditionGrade.replaceAll("_", " "),
            location:
              [item.area, item.city].filter(Boolean).join(", ") || "India",
            href: `/product/${item.id}`,
            featured: item.isFeatured || item.isBoosted,
          }))}
          emptyMessage="No active listings from this seller."
        />
      </div>
      <p className="mt-6 text-xs text-foreground-muted">
        Prices shown in INR, e.g. {formatInr(listings[0]?.priceInr ?? 0)}.
      </p>
    </div>
  );
}
