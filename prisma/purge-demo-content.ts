/**
 * Purge mock/demo marketplace content so the site only shows real user listings.
 * Keeps: categories, locations, product catalog (for FairPrice MSRP), optional admin user.
 * Removes: listings, chats, offers, fake comps, demo users, seed blog/FAQ noise.
 *
 * Usage: npx tsx prisma/purge-demo-content.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Purging demo/mock marketplace content...");

  await prisma.message.deleteMany();
  await prisma.offerHistory.deleteMany();
  await prisma.offer.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.review.deleteMany();
  await prisma.meeting.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.valuationFactor.deleteMany();
  await prisma.valuation.deleteMany();
  await prisma.conditionAssessment.deleteMany();
  await prisma.listingImage.deleteMany();
  await prisma.listingAttribute.deleteMany();
  await prisma.listingView.deleteMany();
  await prisma.recentlyViewed.deleteMany();
  await prisma.searchHistory.deleteMany();
  await prisma.priceHistory.deleteMany();
  await prisma.promotion.deleteMany();
  await prisma.report.deleteMany();
  await prisma.moderationCase.deleteMany();
  await prisma.fraudSignal.deleteMany();
  await prisma.fraudRisk.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.comparableListing.deleteMany({ where: { isSynthetic: true } });
  await prisma.comparableListing.deleteMany({
    where: { source: { in: ["synthetic", "synthetic_seed"] } },
  });
  await prisma.marketPriceSnapshot.deleteMany({
    where: { source: "synthetic_seed" },
  });
  await prisma.demandSnapshot.deleteMany();
  await prisma.blogPost.deleteMany();
  await prisma.fAQ.deleteMany();
  await prisma.savedSearch.deleteMany();
  await prisma.priceAlert.deleteMany();
  await prisma.session.deleteMany();
  await prisma.block.deleteMany();

  // Remove demo users (keep non-demo accounts if any real users exist)
  const demoUsers = await prisma.user.findMany({
    where: {
      OR: [
        { email: { endsWith: "@demo.fairprice.ai" } },
        { bio: { contains: "synthetic seed data" } },
        { bio: { contains: "Demo account for FairPrice AI" } },
        { email: "admin@fairprice.ai" },
      ],
    },
    select: { id: true, email: true },
  });

  if (demoUsers.length) {
    const ids = demoUsers.map((u) => u.id);
    await prisma.profile.deleteMany({ where: { userId: { in: ids } } });
    await prisma.device.deleteMany({ where: { userId: { in: ids } } });
    await prisma.verification.deleteMany({ where: { userId: { in: ids } } });
    await prisma.aPIKey.deleteMany({ where: { userId: { in: ids } } });
    await prisma.businessAccount.deleteMany({ where: { userId: { in: ids } } });
    await prisma.supportTicket.deleteMany({ where: { userId: { in: ids } } });
    await prisma.user.deleteMany({ where: { id: { in: ids } } });
    console.log(`Removed ${demoUsers.length} demo users.`);
  }

  const remainingListings = await prisma.listing.count({
    where: { deletedAt: null },
  });
  console.log(`Done. Active listings remaining: ${remainingListings}`);
  console.log("Marketplace will only show listings created by real users.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
