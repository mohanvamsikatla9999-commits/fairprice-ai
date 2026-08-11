import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { ListingGrid } from "@/components/marketplace/listing-grid";
import { VerificationBadge } from "@/components/verification/verification-badge";
import type { Metadata } from "next";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const user = await prisma.user.findFirst({
    where: { id, deletedAt: null },
    select: { displayName: true, name: true, businessAccount: true },
  });
  const name =
    user?.businessAccount?.companyName ||
    user?.displayName ||
    user?.name ||
    "Seller";
  return { title: `${name} store | FairPrice AI` };
}

export default async function StorePage({ params }: Props) {
  const { id } = await params;
  const seller = await prisma.user.findFirst({
    where: { id, deletedAt: null },
    select: {
      id: true,
      name: true,
      displayName: true,
      avatarUrl: true,
      bio: true,
      trustScore: true,
      verificationLevel: true,
      identityVerifiedAt: true,
      faceVerifiedAt: true,
      phoneVerified: true,
      emailVerified: true,
      businessAccount: true,
      profile: { select: { city: true, state: true, completedSales: true } },
    },
  });
  if (!seller) notFound();

  const listings = await prisma.listing.findMany({
    where: { sellerId: id, status: "ACTIVE", deletedAt: null },
    orderBy: [{ isFeatured: "desc" }, { publishedAt: "desc" }],
    take: 48,
    include: {
      images: { where: { isPrimary: true }, take: 1 },
      category: true,
    },
  });

  const storeName =
    seller.businessAccount?.companyName ||
    seller.displayName ||
    seller.name ||
    "Seller store";

  return (
    <div className="container-page py-10">
      <div className="rounded-3xl border border-border bg-white p-6 md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          {seller.businessAccount ? "Dealer storefront" : "Seller store"}
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold md:text-4xl">
          {storeName}
        </h1>
        <p className="mt-2 text-sm text-foreground-muted">
          {[seller.profile?.city, seller.profile?.state].filter(Boolean).join(", ") ||
            "India"}
          {seller.profile?.completedSales
            ? ` · ${seller.profile.completedSales} completed sales`
            : ""}
          {` · Trust ${seller.trustScore}`}
        </p>
        {seller.bio ? (
          <p className="mt-3 max-w-2xl text-sm text-foreground-muted">{seller.bio}</p>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-2">
          {seller.identityVerifiedAt ? <VerificationBadge kind="identity" /> : null}
          {seller.faceVerifiedAt ? <VerificationBadge kind="face" /> : null}
          {seller.phoneVerified ? <VerificationBadge kind="phone" /> : null}
          {seller.emailVerified ? <VerificationBadge kind="email" /> : null}
          {seller.verificationLevel === "TRUSTED_SELLER" ||
          seller.verificationLevel === "BUSINESS_VERIFIED" ? (
            <VerificationBadge kind="trusted" />
          ) : null}
        </div>
        <Link href="/verify" className="mt-4 inline-block text-sm text-primary hover:underline">
          Why verification matters
        </Link>
      </div>

      <h2 className="mt-10 font-display text-2xl font-semibold">Listings</h2>
      <div className="mt-4">
        <ListingGrid
          listings={listings.map((l) => ({
            id: l.id,
            title: l.title,
            price: l.priceInr,
            imageUrl: l.images[0]?.url ?? "/placeholder-listing.svg",
            condition: l.conditionGrade.replaceAll("_", " "),
            location: [l.city, l.state].filter(Boolean).join(", ") || "India",
            href: `/product/${l.id}`,
            featured: l.isFeatured || l.isBoosted,
          }))}
          emptyMessage="This seller has no active listings right now."
        />
      </div>
    </div>
  );
}
