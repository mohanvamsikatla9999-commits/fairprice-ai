/**
 * Creates a demo POCO M7 listing under the admin account for testing FairPrice AI.
 * Run: npx tsx prisma/seed-demo-listing.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Find admin user
  const admin = await prisma.user.findFirst({
    where: { email: process.env.ADMIN_EMAIL ?? "admin@fairprice.ai" },
  });

  if (!admin) {
    console.error("Admin user not found. Run the main seed first: npm run db:seed");
    process.exit(1);
  }

  // Find mobiles category
  const cat = await prisma.category.findFirst({
    where: { slug: "mobiles" },
  });

  if (!cat) {
    console.error("Mobiles category not found. Run the main seed first.");
    process.exit(1);
  }

  // Check if demo listing already exists
  const existing = await prisma.listing.findFirst({
    where: {
      sellerId: admin.id,
      title: { contains: "POCO M7" },
    },
  });

  if (existing) {
    console.log(`Demo listing already exists: ${existing.id} — ${existing.title}`);
    console.log(`View at: http://localhost:3000/product/${existing.id}`);
    return;
  }

  const listing = await prisma.listing.create({
    data: {
      sellerId: admin.id,
      categoryId: cat.id,
      title: "POCO M7 6GB/128GB Midnight Black — 8 months old",
      slug: `poco-m7-demo-${Date.now()}`,
      description:
        "Selling my POCO M7 6GB RAM 128GB storage in excellent condition. " +
        "Bought 8 months ago at full price from a Xiaomi store. " +
        "Battery health is great (92%), no cracks, minor scratches only. " +
        "Comes with original box, charger, and cable. Selling because upgrading.",
      priceInr: 8500,
      originalPriceInr: 12499,
      conditionGrade: "EXCELLENT",
      status: "ACTIVE",
      sellerType: "INDIVIDUAL",
      city: "Hyderabad",
      state: "Telangana",
      lat: 17.385,
      lng: 78.4867,
      publishedAt: new Date(),
      expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      attributes: {
        create: [
          { key: "ram", value: "6GB" },
          { key: "storage", value: "128GB" },
          { key: "battery_mah", value: "5030" },
          { key: "processor", value: "MediaTek Helio G85" },
          { key: "os", value: "Android 14 / MIUI 14" },
          { key: "color", value: "Midnight Black" },
          { key: "warranty_months", value: "4" },
          { key: "box_contents", value: "Original box, 18W charger, USB-C cable" },
          { key: "age_months", value: "8" },
        ],
      },
    },
    include: { attributes: true },
  });

  console.log(`\nDemo listing created!`);
  console.log(`  ID: ${listing.id}`);
  console.log(`  Title: ${listing.title}`);
  console.log(`  Price: ₹${listing.priceInr.toLocaleString("en-IN")}`);
  console.log(`  MRP: ₹${listing.originalPriceInr?.toLocaleString("en-IN")}`);
  console.log(`\nView at: http://localhost:3000/product/${listing.id}`);
  console.log(`\nClick "Check FairPrice" to test the Gemini-powered valuation.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
