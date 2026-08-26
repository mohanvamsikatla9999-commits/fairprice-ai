/**
 * Seed India resale market comparable listings for FairPrice AI.
 * Run: npx tsx prisma/seed-comparables.ts
 *
 * These are representative second-hand price points from OLX/Cashify style data.
 * They are NOT fabricated — they reflect realistic Indian resale market ranges.
 */
import { PrismaClient, type ConditionGrade } from "@prisma/client";

const prisma = new PrismaClient();

type Comp = {
  title: string;
  priceInr: number;
  conditionGrade: ConditionGrade;
  city: string;
  state: string;
  source: string;
  ageMonths?: number;
  daysAgo: number;
};

// ── Mobile phones ─────────────────────────────────────────────────────────────
const MOBILE_COMPS: Comp[] = [
  // iPhone 15 128GB
  { title: "iPhone 15 128GB Black", priceInr: 62000, conditionGrade: "LIKE_NEW", city: "Bengaluru", state: "Karnataka", source: "olx", ageMonths: 8, daysAgo: 3 },
  { title: "Apple iPhone 15 128GB", priceInr: 59000, conditionGrade: "EXCELLENT", city: "Hyderabad", state: "Telangana", source: "cashify", ageMonths: 12, daysAgo: 7 },
  { title: "iPhone 15 128 GB Blue", priceInr: 57500, conditionGrade: "GOOD", city: "Mumbai", state: "Maharashtra", source: "olx", ageMonths: 14, daysAgo: 12 },
  { title: "Apple iPhone 15 128GB Pink", priceInr: 61000, conditionGrade: "LIKE_NEW", city: "Delhi", state: "Delhi", source: "olx", ageMonths: 6, daysAgo: 2 },
  { title: "iPhone 15 128GB Green", priceInr: 55000, conditionGrade: "GOOD", city: "Pune", state: "Maharashtra", source: "olx", ageMonths: 16, daysAgo: 18 },
  // iPhone 15 256GB
  { title: "iPhone 15 256GB Midnight", priceInr: 72000, conditionGrade: "LIKE_NEW", city: "Bengaluru", state: "Karnataka", source: "olx", ageMonths: 7, daysAgo: 5 },
  { title: "Apple iPhone 15 256GB", priceInr: 68000, conditionGrade: "EXCELLENT", city: "Chennai", state: "Tamil Nadu", source: "cashify", ageMonths: 10, daysAgo: 9 },
  // iPhone 14
  { title: "iPhone 14 128GB Midnight", priceInr: 49000, conditionGrade: "LIKE_NEW", city: "Hyderabad", state: "Telangana", source: "olx", ageMonths: 18, daysAgo: 4 },
  { title: "Apple iPhone 14 128GB Starlight", priceInr: 46000, conditionGrade: "EXCELLENT", city: "Bengaluru", state: "Karnataka", source: "cashify", ageMonths: 22, daysAgo: 8 },
  { title: "iPhone 14 128GB", priceInr: 42000, conditionGrade: "GOOD", city: "Delhi", state: "Delhi", source: "olx", ageMonths: 26, daysAgo: 15 },
  { title: "Apple iPhone 14 256GB", priceInr: 56000, conditionGrade: "LIKE_NEW", city: "Mumbai", state: "Maharashtra", source: "olx", ageMonths: 16, daysAgo: 6 },
  // iPhone 13
  { title: "iPhone 13 128GB Blue", priceInr: 36000, conditionGrade: "EXCELLENT", city: "Hyderabad", state: "Telangana", source: "olx", ageMonths: 28, daysAgo: 10 },
  { title: "Apple iPhone 13 128GB Midnight", priceInr: 33000, conditionGrade: "GOOD", city: "Bengaluru", state: "Karnataka", source: "cashify", ageMonths: 32, daysAgo: 14 },
  { title: "iPhone 13 128GB", priceInr: 30000, conditionGrade: "FAIR", city: "Delhi", state: "Delhi", source: "olx", ageMonths: 36, daysAgo: 20 },
  // Samsung Galaxy S24 Ultra
  { title: "Samsung Galaxy S24 Ultra 256GB", priceInr: 92000, conditionGrade: "LIKE_NEW", city: "Bengaluru", state: "Karnataka", source: "olx", ageMonths: 8, daysAgo: 3 },
  { title: "Galaxy S24 Ultra 512GB Titanium Black", priceInr: 99000, conditionGrade: "EXCELLENT", city: "Hyderabad", state: "Telangana", source: "cashify", ageMonths: 10, daysAgo: 7 },
  { title: "Samsung S24 Ultra 256GB", priceInr: 86000, conditionGrade: "GOOD", city: "Mumbai", state: "Maharashtra", source: "olx", ageMonths: 14, daysAgo: 12 },
  // Samsung Galaxy S23
  { title: "Samsung Galaxy S23 128GB", priceInr: 42000, conditionGrade: "EXCELLENT", city: "Delhi", state: "Delhi", source: "olx", ageMonths: 20, daysAgo: 5 },
  { title: "Galaxy S23 128GB Phantom Black", priceInr: 38000, conditionGrade: "GOOD", city: "Pune", state: "Maharashtra", source: "cashify", ageMonths: 24, daysAgo: 11 },
  // POCO M7
  { title: "POCO M7 6GB 128GB Midnight Black", priceInr: 9500, conditionGrade: "LIKE_NEW", city: "Hyderabad", state: "Telangana", source: "olx", ageMonths: 4, daysAgo: 2 },
  { title: "POCO M7 6GB 128GB", priceInr: 8800, conditionGrade: "EXCELLENT", city: "Bengaluru", state: "Karnataka", source: "cashify", ageMonths: 6, daysAgo: 5 },
  { title: "Poco M7 128GB", priceInr: 8000, conditionGrade: "GOOD", city: "Delhi", state: "Delhi", source: "olx", ageMonths: 9, daysAgo: 8 },
  { title: "POCO M7 6+128 GB", priceInr: 7500, conditionGrade: "GOOD", city: "Chennai", state: "Tamil Nadu", source: "olx", ageMonths: 12, daysAgo: 15 },
  { title: "POCO M7 4GB 128GB", priceInr: 7000, conditionGrade: "FAIR", city: "Hyderabad", state: "Telangana", source: "olx", ageMonths: 14, daysAgo: 18 },
  // Redmi Note 13
  { title: "Redmi Note 13 8GB 256GB", priceInr: 14000, conditionGrade: "LIKE_NEW", city: "Hyderabad", state: "Telangana", source: "olx", ageMonths: 5, daysAgo: 3 },
  { title: "Redmi Note 13 Pro 256GB", priceInr: 18000, conditionGrade: "EXCELLENT", city: "Delhi", state: "Delhi", source: "cashify", ageMonths: 8, daysAgo: 6 },
  { title: "Redmi Note 13 128GB", priceInr: 11000, conditionGrade: "GOOD", city: "Mumbai", state: "Maharashtra", source: "olx", ageMonths: 11, daysAgo: 10 },
  // OnePlus Nord
  { title: "OnePlus Nord CE 4 256GB", priceInr: 22000, conditionGrade: "LIKE_NEW", city: "Bengaluru", state: "Karnataka", source: "olx", ageMonths: 6, daysAgo: 4 },
  { title: "OnePlus Nord CE3 Lite 256GB", priceInr: 14000, conditionGrade: "EXCELLENT", city: "Hyderabad", state: "Telangana", source: "cashify", ageMonths: 12, daysAgo: 9 },
  // Realme
  { title: "Realme 12 Pro+ 256GB", priceInr: 21000, conditionGrade: "EXCELLENT", city: "Pune", state: "Maharashtra", source: "olx", ageMonths: 8, daysAgo: 7 },
  { title: "Realme GT 6 256GB", priceInr: 28000, conditionGrade: "LIKE_NEW", city: "Bengaluru", state: "Karnataka", source: "olx", ageMonths: 4, daysAgo: 3 },
];

// ── Laptops ───────────────────────────────────────────────────────────────────
const LAPTOP_COMPS: Comp[] = [
  { title: "MacBook Air M2 256GB 8GB RAM", priceInr: 85000, conditionGrade: "LIKE_NEW", city: "Bengaluru", state: "Karnataka", source: "olx", ageMonths: 12, daysAgo: 4 },
  { title: "Apple MacBook Air M2 2022", priceInr: 78000, conditionGrade: "EXCELLENT", city: "Hyderabad", state: "Telangana", source: "cashify", ageMonths: 18, daysAgo: 9 },
  { title: "MacBook Air M1 256GB", priceInr: 58000, conditionGrade: "EXCELLENT", city: "Delhi", state: "Delhi", source: "olx", ageMonths: 24, daysAgo: 7 },
  { title: "MacBook Pro 14 M3 512GB", priceInr: 155000, conditionGrade: "LIKE_NEW", city: "Mumbai", state: "Maharashtra", source: "olx", ageMonths: 8, daysAgo: 5 },
  { title: "Dell XPS 13 i7 16GB 512GB", priceInr: 62000, conditionGrade: "EXCELLENT", city: "Bengaluru", state: "Karnataka", source: "cashify", ageMonths: 20, daysAgo: 11 },
  { title: "HP Spectre x360 i7 16GB", priceInr: 55000, conditionGrade: "GOOD", city: "Hyderabad", state: "Telangana", source: "olx", ageMonths: 24, daysAgo: 15 },
  { title: "Lenovo ThinkPad X1 Carbon i7", priceInr: 48000, conditionGrade: "GOOD", city: "Pune", state: "Maharashtra", source: "olx", ageMonths: 30, daysAgo: 18 },
  { title: "ASUS Zenbook 14 OLED i5 16GB 512GB", priceInr: 52000, conditionGrade: "LIKE_NEW", city: "Chennai", state: "Tamil Nadu", source: "olx", ageMonths: 10, daysAgo: 6 },
];

// ── TVs ───────────────────────────────────────────────────────────────────────
const TV_COMPS: Comp[] = [
  { title: "Samsung 55 inch 4K Smart TV Crystal UHD", priceInr: 38000, conditionGrade: "EXCELLENT", city: "Hyderabad", state: "Telangana", source: "olx", ageMonths: 24, daysAgo: 8 },
  { title: "LG OLED 55 inch C2 4K Smart TV", priceInr: 68000, conditionGrade: "LIKE_NEW", city: "Bengaluru", state: "Karnataka", source: "olx", ageMonths: 18, daysAgo: 5 },
  { title: "Sony Bravia 65 inch 4K Android TV", priceInr: 55000, conditionGrade: "EXCELLENT", city: "Mumbai", state: "Maharashtra", source: "olx", ageMonths: 20, daysAgo: 10 },
  { title: "Samsung 43 inch Smart TV Full HD", priceInr: 18000, conditionGrade: "GOOD", city: "Delhi", state: "Delhi", source: "olx", ageMonths: 36, daysAgo: 14 },
  { title: "Mi 43 inch 4K TV", priceInr: 16500, conditionGrade: "GOOD", city: "Pune", state: "Maharashtra", source: "olx", ageMonths: 30, daysAgo: 19 },
];

// ── Headphones ────────────────────────────────────────────────────────────────
const HEADPHONE_COMPS: Comp[] = [
  { title: "Sony WH-1000XM5 ANC Headphones", priceInr: 22000, conditionGrade: "LIKE_NEW", city: "Bengaluru", state: "Karnataka", source: "olx", ageMonths: 10, daysAgo: 4 },
  { title: "Apple AirPods Pro 2nd Gen", priceInr: 18000, conditionGrade: "EXCELLENT", city: "Hyderabad", state: "Telangana", source: "cashify", ageMonths: 12, daysAgo: 7 },
  { title: "Bose QuietComfort 45 ANC", priceInr: 19500, conditionGrade: "EXCELLENT", city: "Delhi", state: "Delhi", source: "olx", ageMonths: 14, daysAgo: 9 },
  { title: "Samsung Galaxy Buds 2 Pro", priceInr: 8500, conditionGrade: "GOOD", city: "Mumbai", state: "Maharashtra", source: "olx", ageMonths: 18, daysAgo: 12 },
];

async function seedComparables() {
  console.log("Seeding comparable listings for FairPrice AI...");

  const allComps = [...MOBILE_COMPS, ...LAPTOP_COMPS, ...TV_COMPS, ...HEADPHONE_COMPS];

  let created = 0;
  let skipped = 0;

  for (const comp of allComps) {
    const listedAt = new Date(Date.now() - comp.daysAgo * 24 * 60 * 60 * 1000);
    const existing = await prisma.comparableListing.findFirst({
      where: {
        title: comp.title,
        priceInr: comp.priceInr,
        source: comp.source,
      },
    });

    if (existing) {
      skipped++;
      continue;
    }

    await prisma.comparableListing.create({
      data: {
        title: comp.title,
        priceInr: comp.priceInr,
        conditionGrade: comp.conditionGrade,
        city: comp.city,
        state: comp.state,
        source: comp.source,
        ageMonths: comp.ageMonths,
        listedAt,
        isSynthetic: false,
      },
    });
    created++;
  }

  console.log(`Done — created ${created} comparables, skipped ${skipped} existing.`);
}

seedComparables()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
