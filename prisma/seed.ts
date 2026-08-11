/**
 * FairPrice AI — comprehensive demo seed
 * Idempotent-ish: clears demo-related rows in FK-safe order, then upserts catalog/users.
 * Marked as demo data in bios/descriptions where appropriate.
 */
import {
  PrismaClient,
  Role,
  VerificationLevel,
  ListingStatus,
  ConditionGrade,
  PriceVerdict,
  OfferStatus,
  TransactionStatus,
  NotificationType,
  AttributeType,
  type Prisma,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const PLACEHOLDER = "/placeholders/product.svg";
const DEMO_BIO = "Demo account for FairPrice AI — synthetic seed data.";

const CITIES = [
  { city: "Hyderabad", state: "Telangana", lat: 17.385, lng: 78.4867 },
  { city: "Bengaluru", state: "Karnataka", lat: 12.9716, lng: 77.5946 },
  { city: "Mumbai", state: "Maharashtra", lat: 19.076, lng: 72.8777 },
  { city: "Delhi", state: "Delhi", lat: 28.6139, lng: 77.209 },
  { city: "Pune", state: "Maharashtra", lat: 18.5204, lng: 73.8567 },
  { city: "Chennai", state: "Tamil Nadu", lat: 13.0827, lng: 80.2707 },
  { city: "Kolkata", state: "West Bengal", lat: 22.5726, lng: 88.3639 },
  { city: "Ahmedabad", state: "Gujarat", lat: 23.0225, lng: 72.5714 },
] as const;

const FIRST_NAMES = [
  "Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Sai", "Reyansh", "Ayaan",
  "Krishna", "Ishaan", "Shaurya", "Atharv", "Advait", "Kabir", "Ananya",
  "Aadhya", "Diya", "Myra", "Sara", "Anika", "Aarohi", "Pari", "Kiara",
  "Navya", "Anvi", "Ira", "Prisha", "Riya", "Saanvi", "Meera", "Rohan",
  "Karan", "Nikhil", "Rahul", "Sneha", "Priya", "Neha", "Pooja", "Amit",
  "Vikram", "Suresh", "Deepak", "Manish", "Kavya", "Isha", "Tanvi", "Harsh",
  "Yash", "Dev", "Lakshmi", "Gaurav", "Shreya", "Nisha", "Varun", "Ritu",
];

const LAST_NAMES = [
  "Sharma", "Verma", "Patel", "Reddy", "Iyer", "Nair", "Khan", "Singh",
  "Gupta", "Mehta", "Joshi", "Chopra", "Desai", "Malhotra", "Banerjee",
  "Mukherjee", "Pillai", "Rao", "Kapoor", "Agarwal", "Choudhary", "Das",
  "Bhat", "Menon", "Kulkarni", "Saxena", "Trivedi", "Naidu", "Shetty", "Bose",
];

const CATEGORIES = [
  { name: "Mobiles", slug: "mobiles", icon: "smartphone", description: "Phones and accessories" },
  { name: "Laptops & Computers", slug: "laptops", icon: "laptop", description: "Laptops, desktops, peripherals" },
  { name: "Cars", slug: "cars", icon: "car", description: "Used cars and SUVs" },
  { name: "Bikes & Scooters", slug: "bikes", icon: "bike", description: "Two-wheelers" },
  { name: "Furniture", slug: "furniture", icon: "sofa", description: "Home and office furniture" },
  { name: "Electronics", slug: "electronics", icon: "tv", description: "TVs, cameras, gadgets" },
  { name: "Appliances", slug: "appliances", icon: "washing-machine", description: "Home appliances" },
  { name: "Fashion", slug: "fashion", icon: "shirt", description: "Clothing and accessories" },
  { name: "Watches & Jewellery", slug: "watches-jewellery", icon: "watch", description: "Watches and jewellery" },
  { name: "Books", slug: "books", icon: "book", description: "Books and study material" },
  { name: "Sports & Fitness", slug: "sports", icon: "dumbbell", description: "Sports gear and fitness" },
  { name: "Kids & Baby", slug: "kids", icon: "baby", description: "Kids and baby products" },
  { name: "Home & Kitchen", slug: "home-kitchen", icon: "home", description: "Home and kitchen items" },
  { name: "Cameras", slug: "cameras", icon: "camera", description: "Cameras and lenses" },
  { name: "Gaming", slug: "gaming", icon: "gamepad", description: "Consoles and games" },
  { name: "Musical Instruments", slug: "musical-instruments", icon: "music", description: "Instruments and gear" },
  { name: "Pets", slug: "pets", icon: "paw", description: "Pet supplies" },
  { name: "Tools & DIY", slug: "tools", icon: "wrench", description: "Tools and DIY" },
  { name: "Property Rentals", slug: "property-rentals", icon: "building", description: "Short-term rentals" },
  { name: "Property Sale", slug: "property-sale", icon: "home", description: "Homes and plots — waitlist" },
  { name: "Jobs", slug: "jobs", icon: "briefcase", description: "Local jobs — waitlist" },
  { name: "Services", slug: "services", icon: "briefcase", description: "Local services" },
  { name: "Collectibles", slug: "collectibles", icon: "gem", description: "Collectibles and antiques" },
  { name: "Other", slug: "other", icon: "package", description: "Everything else" },
] as const;

const CONDITIONS: ConditionGrade[] = [
  "LIKE_NEW",
  "EXCELLENT",
  "GOOD",
  "FAIR",
  "POOR",
];

const SAFETY_PHRASES = [
  "Please share the OTP once you receive it so I can confirm payment.",
  "Scan this QR and pay, then WhatsApp me the screenshot.",
  "Send money first as booking amount, courier will collect tomorrow.",
  "Enter your UPI PIN on this link to verify: https://bit.ly/fake-verify",
  "Message me on WhatsApp only, do not use the app chat.",
];

type ProductDef = {
  brand: string;
  name: string;
  slug: string;
  categorySlug: string;
  description: string;
  variants: Array<{ name: string; sku: string; msrpInr: number; attributes: Record<string, string | number> }>;
};

const PRODUCTS: ProductDef[] = [
  {
    brand: "Apple",
    name: "iPhone 15 Pro",
    slug: "iphone-15-pro",
    categorySlug: "mobiles",
    description: "Demo catalog — Apple iPhone 15 Pro",
    variants: [
      { name: "128GB Natural Titanium", sku: "IP15P-128-NT", msrpInr: 134900, attributes: { storage: "128GB", color: "Natural Titanium" } },
      { name: "256GB Blue Titanium", sku: "IP15P-256-BT", msrpInr: 144900, attributes: { storage: "256GB", color: "Blue Titanium" } },
      { name: "512GB Black Titanium", sku: "IP15P-512-BK", msrpInr: 164900, attributes: { storage: "512GB", color: "Black Titanium" } },
    ],
  },
  {
    brand: "Apple",
    name: "iPhone 14",
    slug: "iphone-14",
    categorySlug: "mobiles",
    description: "Demo catalog — Apple iPhone 14",
    variants: [
      { name: "128GB Midnight", sku: "IP14-128-MD", msrpInr: 69900, attributes: { storage: "128GB", color: "Midnight" } },
      { name: "256GB Starlight", sku: "IP14-256-SL", msrpInr: 79900, attributes: { storage: "256GB", color: "Starlight" } },
    ],
  },
  {
    brand: "Apple",
    name: "iPhone 13",
    slug: "iphone-13",
    categorySlug: "mobiles",
    description: "Demo catalog — Apple iPhone 13",
    variants: [
      { name: "128GB Blue", sku: "IP13-128-BL", msrpInr: 59900, attributes: { storage: "128GB", color: "Blue" } },
    ],
  },
  {
    brand: "Samsung",
    name: "Galaxy S24 Ultra",
    slug: "galaxy-s24-ultra",
    categorySlug: "mobiles",
    description: "Demo catalog — Samsung Galaxy S24 Ultra",
    variants: [
      { name: "256GB Titanium Gray", sku: "S24U-256-TG", msrpInr: 129999, attributes: { storage: "256GB", color: "Titanium Gray" } },
      { name: "512GB Titanium Black", sku: "S24U-512-TB", msrpInr: 141999, attributes: { storage: "512GB", color: "Titanium Black" } },
    ],
  },
  {
    brand: "Samsung",
    name: "Galaxy S23",
    slug: "galaxy-s23",
    categorySlug: "mobiles",
    description: "Demo catalog — Samsung Galaxy S23",
    variants: [
      { name: "128GB Phantom Black", sku: "S23-128-PB", msrpInr: 74999, attributes: { storage: "128GB", color: "Phantom Black" } },
    ],
  },
  {
    brand: "Google",
    name: "Pixel 8 Pro",
    slug: "pixel-8-pro",
    categorySlug: "mobiles",
    description: "Demo catalog — Google Pixel 8 Pro",
    variants: [
      { name: "128GB Obsidian", sku: "P8P-128-OB", msrpInr: 106999, attributes: { storage: "128GB", color: "Obsidian" } },
      { name: "256GB Porcelain", sku: "P8P-256-PO", msrpInr: 119999, attributes: { storage: "256GB", color: "Porcelain" } },
    ],
  },
  {
    brand: "OnePlus",
    name: "OnePlus 12",
    slug: "oneplus-12",
    categorySlug: "mobiles",
    description: "Demo catalog — OnePlus 12",
    variants: [
      { name: "256GB Flowy Emerald", sku: "OP12-256-FE", msrpInr: 64999, attributes: { storage: "256GB", color: "Flowy Emerald" } },
      { name: "512GB Silky Black", sku: "OP12-512-SB", msrpInr: 69999, attributes: { storage: "512GB", color: "Silky Black" } },
    ],
  },
  {
    brand: "POCO",
    name: "M7",
    slug: "poco-m7",
    categorySlug: "mobiles",
    description: "Demo catalog — POCO M7 (budget)",
    variants: [
      { name: "64GB Power Black", sku: "POCO-M7-64", msrpInr: 10999, attributes: { storage: "64GB", color: "Power Black" } },
      { name: "128GB Power Black", sku: "POCO-M7-128", msrpInr: 12499, attributes: { storage: "128GB", color: "Power Black" } },
    ],
  },
  {
    brand: "POCO",
    name: "M6",
    slug: "poco-m6",
    categorySlug: "mobiles",
    description: "Demo catalog — POCO M6",
    variants: [
      { name: "128GB Black", sku: "POCO-M6-128", msrpInr: 10999, attributes: { storage: "128GB", color: "Black" } },
    ],
  },
  {
    brand: "Redmi",
    name: "13C",
    slug: "redmi-13c",
    categorySlug: "mobiles",
    description: "Demo catalog — Redmi 13C",
    variants: [
      { name: "128GB Navy Blue", sku: "REDMI-13C-128", msrpInr: 8999, attributes: { storage: "128GB", color: "Navy Blue" } },
    ],
  },
  {
    brand: "Redmi",
    name: "Note 13 5G",
    slug: "redmi-note-13-5g",
    categorySlug: "mobiles",
    description: "Demo catalog — Redmi Note 13 5G",
    variants: [
      { name: "128GB Arctic White", sku: "RN13-5G-128", msrpInr: 17999, attributes: { storage: "128GB", color: "Arctic White" } },
    ],
  },
  {
    brand: "Realme",
    name: "Narzo N61",
    slug: "realme-narzo-n61",
    categorySlug: "mobiles",
    description: "Demo catalog — Realme Narzo N61",
    variants: [
      { name: "64GB Voyage Blue", sku: "NARZO-N61-64", msrpInr: 8999, attributes: { storage: "64GB", color: "Voyage Blue" } },
    ],
  },
  {
    brand: "Samsung",
    name: "Galaxy A15 5G",
    slug: "samsung-galaxy-a15-5g",
    categorySlug: "mobiles",
    description: "Demo catalog — Galaxy A15 5G",
    variants: [
      { name: "128GB Blue Black", sku: "A15-5G-128", msrpInr: 18999, attributes: { storage: "128GB", color: "Blue Black" } },
    ],
  },
  {
    brand: "Apple",
    name: "MacBook Pro 14 M3",
    slug: "macbook-pro-14-m3",
    categorySlug: "laptops",
    description: "Demo catalog — MacBook Pro 14 M3",
    variants: [
      { name: "M3 8/512 Space Gray", sku: "MBP14-M3-8-512", msrpInr: 169900, attributes: { ram: "8GB", storage: "512GB", chip: "M3" } },
      { name: "M3 Pro 18/512 Silver", sku: "MBP14-M3P-18-512", msrpInr: 199900, attributes: { ram: "18GB", storage: "512GB", chip: "M3 Pro" } },
    ],
  },
  {
    brand: "Apple",
    name: "MacBook Air 13 M2",
    slug: "macbook-air-13-m2",
    categorySlug: "laptops",
    description: "Demo catalog — MacBook Air 13 M2",
    variants: [
      { name: "M2 8/256 Midnight", sku: "MBA13-M2-8-256", msrpInr: 99900, attributes: { ram: "8GB", storage: "256GB", chip: "M2" } },
      { name: "M2 16/512 Starlight", sku: "MBA13-M2-16-512", msrpInr: 134900, attributes: { ram: "16GB", storage: "512GB", chip: "M2" } },
    ],
  },
  {
    brand: "Dell",
    name: "XPS 15",
    slug: "dell-xps-15",
    categorySlug: "laptops",
    description: "Demo catalog — Dell XPS 15",
    variants: [
      { name: "i7 16/512 OLED", sku: "XPS15-I7-16-512", msrpInr: 189990, attributes: { ram: "16GB", storage: "512GB", cpu: "i7" } },
      { name: "i9 32/1TB", sku: "XPS15-I9-32-1T", msrpInr: 249990, attributes: { ram: "32GB", storage: "1TB", cpu: "i9" } },
    ],
  },
  {
    brand: "HP",
    name: "Pavilion 15",
    slug: "hp-pavilion-15",
    categorySlug: "laptops",
    description: "Demo catalog — HP Pavilion 15",
    variants: [
      { name: "Ryzen 5 16/512", sku: "HPP15-R5-16-512", msrpInr: 62990, attributes: { ram: "16GB", storage: "512GB", cpu: "Ryzen 5" } },
    ],
  },
  {
    brand: "Custom",
    name: "Gaming Desktop RTX 4070",
    slug: "gaming-pc-rtx-4070",
    categorySlug: "laptops",
    description: "Demo catalog — custom gaming PC",
    variants: [
      { name: "Ryzen 7 / 32GB / 1TB", sku: "GPC-4070-R7", msrpInr: 145000, attributes: { gpu: "RTX 4070", ram: "32GB", storage: "1TB" } },
    ],
  },
  {
    brand: "Sony",
    name: "PlayStation 5",
    slug: "playstation-5",
    categorySlug: "gaming",
    description: "Demo catalog — PlayStation 5",
    variants: [
      { name: "Disc Edition", sku: "PS5-DISC", msrpInr: 54990, attributes: { edition: "Disc" } },
      { name: "Digital Edition", sku: "PS5-DIGITAL", msrpInr: 44990, attributes: { edition: "Digital" } },
    ],
  },
  {
    brand: "Microsoft",
    name: "Xbox Series X",
    slug: "xbox-series-x",
    categorySlug: "gaming",
    description: "Demo catalog — Xbox Series X",
    variants: [
      { name: "1TB Black", sku: "XSX-1TB", msrpInr: 52990, attributes: { storage: "1TB" } },
    ],
  },
  {
    brand: "Sony",
    name: "Alpha A7 IV",
    slug: "sony-a7-iv",
    categorySlug: "cameras",
    description: "Demo catalog — Sony A7 IV",
    variants: [
      { name: "Body only", sku: "A7IV-BODY", msrpInr: 224990, attributes: { kit: "Body" } },
      { name: "28-70 Kit", sku: "A7IV-2870", msrpInr: 249990, attributes: { kit: "28-70" } },
    ],
  },
  {
    brand: "Canon",
    name: "EOS R6 Mark II",
    slug: "canon-eos-r6-ii",
    categorySlug: "cameras",
    description: "Demo catalog — Canon EOS R6 II",
    variants: [
      { name: "Body only", sku: "R6II-BODY", msrpInr: 239990, attributes: { kit: "Body" } },
    ],
  },
  {
    brand: "Samsung",
    name: "65 inch QLED 4K TV",
    slug: "samsung-65-qled",
    categorySlug: "electronics",
    description: "Demo catalog — Samsung QLED TV",
    variants: [
      { name: "65 Q80C", sku: "QLED65-Q80C", msrpInr: 149990, attributes: { size: "65", panel: "QLED" } },
    ],
  },
  {
    brand: "LG",
    name: "55 inch OLED C3",
    slug: "lg-55-oled-c3",
    categorySlug: "electronics",
    description: "Demo catalog — LG OLED C3",
    variants: [
      { name: "55 C3", sku: "OLED55-C3", msrpInr: 129990, attributes: { size: "55", panel: "OLED" } },
    ],
  },
  {
    brand: "IKEA",
    name: "MALM Bed Frame",
    slug: "ikea-malm-bed",
    categorySlug: "furniture",
    description: "Demo catalog — IKEA MALM bed",
    variants: [
      { name: "Queen White", sku: "MALM-Q-W", msrpInr: 18990, attributes: { size: "Queen", color: "White" } },
    ],
  },
  {
    brand: "Pepperfry",
    name: "Solid Wood Dining Set",
    slug: "solid-wood-dining-set",
    categorySlug: "furniture",
    description: "Demo catalog — dining set",
    variants: [
      { name: "6-seater teak", sku: "DINING-6-TEAK", msrpInr: 45990, attributes: { seats: 6, material: "Teak" } },
    ],
  },
  {
    brand: "Urban Ladder",
    name: "Ergo Office Chair",
    slug: "ergo-office-chair",
    categorySlug: "furniture",
    description: "Demo catalog — office chair",
    variants: [
      { name: "Mesh Black", sku: "CHAIR-MESH-BK", msrpInr: 12999, attributes: { color: "Black" } },
    ],
  },
  {
    brand: "Royal Enfield",
    name: "Classic 350",
    slug: "re-classic-350",
    categorySlug: "bikes",
    description: "Demo catalog — Royal Enfield Classic 350",
    variants: [
      { name: "Signals Marsh Grey", sku: "RE350-SMG", msrpInr: 193000, attributes: { engineCc: 349, color: "Marsh Grey" } },
    ],
  },
  {
    brand: "Honda",
    name: "Activa 6G",
    slug: "honda-activa-6g",
    categorySlug: "bikes",
    description: "Demo catalog — Honda Activa 6G",
    variants: [
      { name: "Standard Pearl", sku: "ACTIVA6G-STD", msrpInr: 78000, attributes: { engineCc: 109, color: "Pearl" } },
    ],
  },
  {
    brand: "TVS",
    name: "Apache RTR 160",
    slug: "tvs-apache-rtr-160",
    categorySlug: "bikes",
    description: "Demo catalog — TVS Apache RTR 160",
    variants: [
      { name: "Racing Red", sku: "RTR160-RR", msrpInr: 125000, attributes: { engineCc: 159, color: "Racing Red" } },
    ],
  },
  {
    brand: "Maruti Suzuki",
    name: "Swift VXI",
    slug: "maruti-swift-vxi",
    categorySlug: "cars",
    description: "Demo catalog — Maruti Swift VXI",
    variants: [
      { name: "2021 Petrol Manual", sku: "SWIFT-21-VXI", msrpInr: 750000, attributes: { year: 2021, fuel: "Petrol", transmission: "Manual" } },
      { name: "2023 Petrol AMT", sku: "SWIFT-23-AMT", msrpInr: 850000, attributes: { year: 2023, fuel: "Petrol", transmission: "AMT" } },
    ],
  },
  {
    brand: "Hyundai",
    name: "Creta SX",
    slug: "hyundai-creta-sx",
    categorySlug: "cars",
    description: "Demo catalog — Hyundai Creta SX",
    variants: [
      { name: "2022 Diesel AT", sku: "CRETA-22-SX-D", msrpInr: 1450000, attributes: { year: 2022, fuel: "Diesel", transmission: "AT" } },
    ],
  },
  {
    brand: "Tata",
    name: "Nexon EV",
    slug: "tata-nexon-ev",
    categorySlug: "cars",
    description: "Demo catalog — Tata Nexon EV",
    variants: [
      { name: "2023 Fearless+", sku: "NEXON-EV-23-FP", msrpInr: 1749000, attributes: { year: 2023, fuel: "Electric", transmission: "AT" } },
    ],
  },
  {
    brand: "Honda",
    name: "City VX",
    slug: "honda-city-vx",
    categorySlug: "cars",
    description: "Demo catalog — Honda City VX",
    variants: [
      { name: "2020 Petrol CVT", sku: "CITY-20-VX-CVT", msrpInr: 1250000, attributes: { year: 2020, fuel: "Petrol", transmission: "CVT" } },
    ],
  },
];

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

function pick<T>(arr: readonly T[], i: number): T {
  return arr[i % arr.length]!;
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function conditionScore(grade: ConditionGrade): number {
  switch (grade) {
    case "LIKE_NEW":
      return 95;
    case "EXCELLENT":
      return 85;
    case "GOOD":
      return 70;
    case "FAIR":
      return 55;
    case "POOR":
      return 35;
  }
}

function priceFromMsrp(msrp: number, grade: ConditionGrade, mode: "fair" | "low" | "high"): number {
  const base =
    grade === "LIKE_NEW"
      ? 0.78
      : grade === "EXCELLENT"
        ? 0.7
        : grade === "GOOD"
          ? 0.6
          : grade === "FAIR"
            ? 0.48
            : 0.35;
  const mult = mode === "low" ? 0.82 : mode === "high" ? 1.22 : 1;
  return Math.max(500, Math.round((msrp * base * mult) / 100) * 100);
}

function verdictFor(asking: number, mid: number): PriceVerdict {
  const ratio = asking / mid;
  if (ratio <= 0.88) return "UNDERPRICED";
  if (ratio <= 1.08) return "FAIR";
  if (ratio <= 1.18) return "SLIGHTLY_HIGH";
  return "OVERPRICED";
}

async function clearDemoData() {
  console.log("Clearing existing demo/relational data (FK-safe order)...");
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
  await prisma.priceHistory.deleteMany();
  await prisma.promotion.deleteMany();
  await prisma.report.deleteMany();
  await prisma.moderationCase.deleteMany();
  await prisma.fraudSignal.deleteMany();
  await prisma.fraudRisk.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.comparableListing.deleteMany();
  await prisma.marketPriceSnapshot.deleteMany();
  await prisma.demandSnapshot.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.categoryAttribute.deleteMany();
  await prisma.category.deleteMany();
  await prisma.blogPost.deleteMany();
  await prisma.fAQ.deleteMany();
  await prisma.savedSearch.deleteMany();
  await prisma.priceAlert.deleteMany();
  await prisma.session.deleteMany();
  await prisma.verification.deleteMany();
  await prisma.device.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.aPIUsage.deleteMany();
  await prisma.aPIKey.deleteMany();
  await prisma.businessAccount.deleteMany();
  await prisma.supportTicket.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.block.deleteMany();
  await prisma.user.deleteMany();
  console.log("Cleared.");
}

async function seedCategories() {
  console.log("Seeding 22 categories...");
  const map = new Map<string, string>();
  for (let i = 0; i < CATEGORIES.length; i++) {
    const c = CATEGORIES[i]!;
    const row = await prisma.category.upsert({
      where: { slug: c.slug },
      create: {
        name: c.name,
        slug: c.slug,
        icon: c.icon,
        description: c.description,
        sortOrder: i,
        isActive: true,
      },
      update: {
        name: c.name,
        icon: c.icon,
        description: c.description,
        sortOrder: i,
        isActive: true,
      },
    });
    map.set(c.slug, row.id);
  }
  return map;
}

async function seedCategoryAttributes(categoryIds: Map<string, string>) {
  console.log("Seeding category attributes (mobiles, laptops, cars)...");
  const defs: Array<{
    categorySlug: string;
    key: string;
    label: string;
    type: AttributeType;
    options?: string[];
    required?: boolean;
    unit?: string;
    sortOrder: number;
  }> = [
    { categorySlug: "mobiles", key: "storage", label: "Storage", type: "SELECT", options: ["32GB", "64GB", "128GB", "256GB", "512GB", "1TB"], required: true, sortOrder: 1 },
    { categorySlug: "mobiles", key: "ram", label: "RAM", type: "SELECT", options: ["2GB", "3GB", "4GB", "6GB", "8GB", "12GB", "16GB"], required: true, sortOrder: 2 },
    { categorySlug: "mobiles", key: "color", label: "Colour", type: "TEXT", sortOrder: 3 },
    { categorySlug: "mobiles", key: "network", label: "Network", type: "SELECT", options: ["4G", "5G"], sortOrder: 4 },
    { categorySlug: "mobiles", key: "ageMonths", label: "Age (months)", type: "NUMBER", required: true, sortOrder: 5 },
    { categorySlug: "mobiles", key: "batteryHealth", label: "Battery health", type: "NUMBER", unit: "%", sortOrder: 6 },
    { categorySlug: "mobiles", key: "screenCondition", label: "Screen condition", type: "SELECT", options: ["Perfect", "Minor scratches", "Visible scratches", "Cracked / damaged"], required: true, sortOrder: 7 },
    { categorySlug: "mobiles", key: "bodyCondition", label: "Body condition", type: "SELECT", options: ["Perfect", "Minor marks", "Dents / scuffs", "Heavy wear"], required: true, sortOrder: 8 },
    { categorySlug: "mobiles", key: "boxAvailable", label: "Original box", type: "BOOLEAN", required: true, sortOrder: 9 },
    { categorySlug: "mobiles", key: "chargerAvailable", label: "Original charger", type: "BOOLEAN", required: true, sortOrder: 10 },
    { categorySlug: "mobiles", key: "earphonesAvailable", label: "Earphones / accessories", type: "BOOLEAN", sortOrder: 11 },
    { categorySlug: "mobiles", key: "invoiceAvailable", label: "Purchase invoice", type: "BOOLEAN", required: true, sortOrder: 12 },
    { categorySlug: "mobiles", key: "warranty", label: "Warranty status", type: "SELECT", options: ["No warranty", "Manufacturer warranty left", "Extended warranty", "Brand care / insured"], required: true, sortOrder: 13 },
    { categorySlug: "mobiles", key: "warrantyMonthsLeft", label: "Warranty months left", type: "NUMBER", sortOrder: 14 },
    { categorySlug: "mobiles", key: "repairHistory", label: "Repair history", type: "SELECT", options: ["Never repaired", "Minor repair", "Screen replaced", "Battery replaced", "Major repair"], required: true, sortOrder: 15 },
    { categorySlug: "mobiles", key: "imeiVerified", label: "IMEI verified", type: "BOOLEAN", sortOrder: 16 },
    { categorySlug: "mobiles", key: "purchasedFrom", label: "Purchased from", type: "SELECT", options: ["Official store", "Amazon / Flipkart", "Local retailer", "Other"], sortOrder: 17 },
    { categorySlug: "laptops", key: "ram", label: "RAM", type: "SELECT", options: ["8GB", "16GB", "32GB", "64GB"], required: true, sortOrder: 1 },
    { categorySlug: "laptops", key: "storage", label: "Storage", type: "SELECT", options: ["256GB", "512GB", "1TB", "2TB"], required: true, sortOrder: 2 },
    { categorySlug: "laptops", key: "cpu", label: "Processor", type: "TEXT", sortOrder: 3 },
    { categorySlug: "laptops", key: "gpu", label: "Graphics", type: "TEXT", sortOrder: 4 },
    { categorySlug: "laptops", key: "screen_size", label: "Screen size", type: "NUMBER", unit: "inch", sortOrder: 5 },
    { categorySlug: "cars", key: "year", label: "Year", type: "NUMBER", required: true, sortOrder: 1 },
    { categorySlug: "cars", key: "km_driven", label: "Kilometres driven", type: "NUMBER", unit: "km", required: true, sortOrder: 2 },
    { categorySlug: "cars", key: "fuel", label: "Fuel", type: "SELECT", options: ["Petrol", "Diesel", "CNG", "Electric", "Hybrid"], required: true, sortOrder: 3 },
    { categorySlug: "cars", key: "transmission", label: "Transmission", type: "SELECT", options: ["Manual", "AMT", "AT", "CVT"], sortOrder: 4 },
    { categorySlug: "cars", key: "owners", label: "Owners", type: "SELECT", options: ["1", "2", "3+"], sortOrder: 5 },
  ];

  for (const d of defs) {
    const categoryId = categoryIds.get(d.categorySlug);
    if (!categoryId) continue;
    await prisma.categoryAttribute.upsert({
      where: { categoryId_key: { categoryId, key: d.key } },
      create: {
        categoryId,
        key: d.key,
        label: d.label,
        type: d.type,
        options: d.options ?? [],
        required: d.required ?? false,
        unit: d.unit,
        sortOrder: d.sortOrder,
      },
      update: {
        label: d.label,
        type: d.type,
        options: d.options ?? [],
        required: d.required ?? false,
        unit: d.unit,
        sortOrder: d.sortOrder,
      },
    });
  }
}

async function seedUsers() {
  console.log("Seeding users (admin, demo, ~100)...");
  const adminHash = await bcrypt.hash("FairPriceAdmin123!", 12);
  const demoHash = await bcrypt.hash("demo1234", 12);
  const genericHash = await bcrypt.hash("FairPriceDemo1!", 12);

  const admin = await prisma.user.create({
    data: {
      email: "admin@fairprice.ai",
      passwordHash: adminHash,
      name: "FairPrice Admin",
      displayName: "Admin",
      role: Role.SUPER_ADMIN,
      verificationLevel: VerificationLevel.IDENTITY_VERIFIED,
      trustScore: 99,
      sellerTrustScore: 99,
      buyerTrustScore: 99,
      onboardingDone: true,
      emailVerified: new Date(),
      bio: "Platform SUPER_ADMIN — demo seed account.",
      profile: {
        create: {
          city: "Hyderabad",
          state: "Telangana",
          country: "IN",
        },
      },
    },
  });

  const buyer = await prisma.user.create({
    data: {
      email: "buyer@demo.fairprice.ai",
      passwordHash: demoHash,
      name: "Demo Buyer",
      displayName: "Demo Buyer",
      role: Role.BUYER,
      verificationLevel: VerificationLevel.EMAIL_VERIFIED,
      trustScore: 72,
      onboardingDone: true,
      emailVerified: new Date(),
      bio: DEMO_BIO,
      preferredCategories: ["mobiles", "laptops", "gaming"],
      profile: {
        create: { city: "Bengaluru", state: "Karnataka", country: "IN" },
      },
    },
  });

  const seller = await prisma.user.create({
    data: {
      email: "seller@demo.fairprice.ai",
      passwordHash: demoHash,
      name: "Demo Seller",
      displayName: "Demo Seller",
      role: Role.SELLER,
      verificationLevel: VerificationLevel.PHONE_VERIFIED,
      trustScore: 78,
      sellerTrustScore: 82,
      onboardingDone: true,
      emailVerified: new Date(),
      phoneVerified: new Date(),
      bio: DEMO_BIO,
      preferredCategories: ["mobiles", "cars", "furniture"],
      profile: {
        create: { city: "Mumbai", state: "Maharashtra", country: "IN" },
      },
    },
  });

  const users = [admin, buyer, seller];

  for (let i = 0; i < 97; i++) {
    const first = pick(FIRST_NAMES, i);
    const last = pick(LAST_NAMES, i * 3);
    const loc = pick(CITIES, i);
    const role =
      i % 5 === 0 ? Role.SELLER : i % 7 === 0 ? Role.BUYER : Role.USER;
    const email = `user${String(i + 1).padStart(3, "0")}@demo.fairprice.ai`;
    const u = await prisma.user.create({
      data: {
        email,
        passwordHash: genericHash,
        name: `${first} ${last}`,
        displayName: first,
        role,
        verificationLevel:
          i % 4 === 0
            ? VerificationLevel.PHONE_VERIFIED
            : i % 3 === 0
              ? VerificationLevel.EMAIL_VERIFIED
              : VerificationLevel.BASIC,
        trustScore: randInt(40, 90),
        sellerTrustScore: randInt(40, 90),
        buyerTrustScore: randInt(40, 90),
        onboardingDone: true,
        emailVerified: new Date(),
        bio: `${DEMO_BIO} Based in ${loc.city}.`,
        profile: {
          create: {
            city: loc.city,
            state: loc.state,
            country: "IN",
            approximateLat: loc.lat + (Math.random() - 0.5) * 0.05,
            approximateLng: loc.lng + (Math.random() - 0.5) * 0.05,
            completedSales: role === Role.SELLER ? randInt(0, 12) : 0,
            completedPurchases: role === Role.BUYER ? randInt(0, 8) : randInt(0, 3),
          },
        },
      },
    });
    users.push(u);
    if ((i + 1) % 25 === 0) console.log(`  ... ${i + 1}/97 users`);
  }

  console.log(`Users created: ${users.length}`);
  return { admin, buyer, seller, users };
}

async function seedProducts(categoryIds: Map<string, string>) {
  console.log("Seeding products + variants...");
  const products: Array<{
    id: string;
    slug: string;
    categoryId: string;
    brand: string;
    name: string;
    variants: Array<{ id: string; name: string; msrpInr: number | null; sku: string | null }>;
  }> = [];

  for (const p of PRODUCTS) {
    const categoryId = categoryIds.get(p.categorySlug);
    if (!categoryId) continue;
    const product = await prisma.product.create({
      data: {
        categoryId,
        brand: p.brand,
        name: p.name,
        slug: p.slug,
        description: `${p.description} (demo seed)`,
        imageUrl: PLACEHOLDER,
        isActive: true,
        variants: {
          create: p.variants.map((v) => ({
            name: v.name,
            sku: v.sku,
            msrpInr: v.msrpInr,
            attributes: v.attributes as Prisma.InputJsonValue,
            isActive: true,
          })),
        },
      },
      include: { variants: true },
    });
    products.push({
      id: product.id,
      slug: product.slug,
      categoryId,
      brand: product.brand,
      name: product.name,
      variants: product.variants.map((v) => ({
        id: v.id,
        name: v.name,
        msrpInr: v.msrpInr,
        sku: v.sku,
      })),
    });
  }
  console.log(`Products: ${products.length}, variants: ${products.reduce((n, p) => n + p.variants.length, 0)}`);
  return products;
}

async function seedMarketData(
  products: Awaited<ReturnType<typeof seedProducts>>,
) {
  console.log("Seeding MarketPriceSnapshot, ComparableListing, DemandSnapshot...");
  let comps = 0;
  for (const product of products) {
    for (const variant of product.variants) {
      const msrp = variant.msrpInr ?? 50000;
      const median = Math.round(msrp * 0.62);
      await prisma.marketPriceSnapshot.create({
        data: {
          productId: product.id,
          variantId: variant.id,
          source: "synthetic_seed",
          medianInr: median,
          p25Inr: Math.round(median * 0.88),
          p75Inr: Math.round(median * 1.12),
          minInr: Math.round(median * 0.7),
          maxInr: Math.round(median * 1.35),
          sampleSize: randInt(12, 80),
          location: pick(CITIES, comps).city,
          conditionGrade: pick(CONDITIONS, comps),
        },
      });

      for (let i = 0; i < 6; i++) {
        const loc = pick(CITIES, comps + i);
        const grade = pick(CONDITIONS, i);
        await prisma.comparableListing.create({
          data: {
            variantId: variant.id,
            externalId: `syn-${variant.sku ?? variant.id}-${i}`,
            source: "synthetic",
            title: `${product.brand} ${product.name} ${variant.name} — demo comparable`,
            priceInr: priceFromMsrp(msrp, grade, i % 3 === 0 ? "low" : i % 3 === 1 ? "fair" : "high"),
            conditionGrade: grade,
            city: loc.city,
            state: loc.state,
            ageMonths: randInt(3, 48),
            listedAt: new Date(Date.now() - randInt(1, 90) * 86400000),
            soldAt: i % 2 === 0 ? new Date(Date.now() - randInt(1, 30) * 86400000) : null,
            isSynthetic: true,
            attributes: { demo: true },
          },
        });
        comps++;
      }
    }

    await prisma.demandSnapshot.create({
      data: {
        productId: product.id,
        categoryId: product.categoryId,
        location: pick(CITIES, comps).city,
        demandScore: Math.round((0.35 + Math.random() * 0.6) * 100) / 100,
        searchVolume: randInt(50, 5000),
        listingCount: randInt(5, 120),
        soldCount: randInt(1, 40),
      },
    });
  }
  console.log(`Comparables created: ${comps}`);
}

async function seedListings(
  products: Awaited<ReturnType<typeof seedProducts>>,
  users: { seller: { id: string }; buyer: { id: string }; users: Array<{ id: string; role: Role }> },
) {
  console.log("Seeding 200+ ACTIVE listings...");
  const sellers = users.users.filter(
    (u) => u.role === Role.SELLER || u.role === Role.USER || u.id === users.seller.id,
  );
  const listings: Array<{
    id: string;
    sellerId: string;
    priceInr: number;
    title: string;
    productLabel: string;
    conditionGrade: ConditionGrade;
    variantId: string | null;
    productId: string | null;
    categoryId: string;
  }> = [];

  let n = 0;
  while (n < 220) {
    const product = pick(products, n);
    const variant = pick(product.variants, n);
    const msrp = variant.msrpInr ?? 50000;
    const grade = pick(CONDITIONS, n);
    const mode = n % 5 === 0 ? "low" : n % 7 === 0 ? "high" : "fair";
    const price = priceFromMsrp(msrp, grade, mode);
    const loc = pick(CITIES, n);
    const seller = pick(sellers, n) ?? users.seller;
    const title = `${product.brand} ${product.name} ${variant.name}`;
    const slug = `${slugify(title)}-${n + 1}`;
    const featured = n % 11 === 0;
    const boosted = n % 13 === 0;
    const aiVerified = n % 4 !== 0;

    const listing = await prisma.listing.create({
      data: {
        sellerId: seller.id,
        categoryId: product.categoryId,
        productId: product.id,
        variantId: variant.id,
        title,
        slug,
        description: `Demo listing #${n + 1} on FairPrice AI. ${title} in ${grade.toLowerCase().replace("_", " ")} condition. Located in ${loc.city}. Synthetic seed data — not a real offer.`,
        priceInr: price,
        originalPriceInr: Math.round(price * 1.08),
        conditionGrade: grade,
        status: ListingStatus.ACTIVE,
        city: loc.city,
        state: loc.state,
        lat: loc.lat,
        lng: loc.lng,
        approximateArea: loc.city,
        views: randInt(10, 2500),
        uniqueViews: randInt(5, 1200),
        favoriteCount: randInt(0, 80),
        isFeatured: featured,
        isBoosted: boosted,
        isAiVerified: aiVerified,
        publishedAt: new Date(Date.now() - randInt(1, 45) * 86400000),
        expiresAt: new Date(Date.now() + 30 * 86400000),
        images: {
          create: [
            {
              storageKey: `demo/${slug}-1`,
              url: PLACEHOLDER,
              alt: title,
              sortOrder: 0,
              isPrimary: true,
              mimeType: "image/svg+xml",
            },
            {
              storageKey: `demo/${slug}-2`,
              url: PLACEHOLDER,
              alt: `${title} angle`,
              sortOrder: 1,
              isPrimary: false,
              mimeType: "image/svg+xml",
            },
          ],
        },
      },
    });

    listings.push({
      id: listing.id,
      sellerId: seller.id,
      priceInr: price,
      title,
      productLabel: `${product.brand} ${product.name}`,
      conditionGrade: grade,
      variantId: variant.id,
      productId: product.id,
      categoryId: product.categoryId,
    });
    n++;
    if (n % 50 === 0) console.log(`  ... ${n} listings`);
  }

  console.log(`Listings: ${listings.length}`);
  return listings;
}

async function seedValuationsAndCondition(
  listings: Awaited<ReturnType<typeof seedListings>>,
  users: { users: Array<{ id: string }> },
) {
  console.log("Seeding ConditionAssessment + Valuation...");
  const sample = listings.slice(0, 140);
  for (let i = 0; i < sample.length; i++) {
    const listing = sample[i]!;
    const score = conditionScore(listing.conditionGrade);
    const mid = Math.round(listing.priceInr / (i % 5 === 0 ? 0.85 : i % 7 === 0 ? 1.2 : 1));
    const fairMin = Math.round(mid * 0.9);
    const fairMax = Math.round(mid * 1.1);
    const asking = listing.priceInr;

    await prisma.conditionAssessment.create({
      data: {
        listingId: listing.id,
        userId: listing.sellerId,
        score,
        grade: listing.conditionGrade,
        confidence: 0.55 + Math.random() * 0.4,
        visibleDamage: listing.conditionGrade === "POOR" || listing.conditionGrade === "FAIR" ? ["scratches", "wear"] : [],
        scratches: listing.conditionGrade === "POOR" ? "Visible edge scratches" : "Light micro-scratches",
        screenCondition: "Demo assessment",
        bodyCondition: "Demo assessment",
        explanation: "Synthetic condition assessment generated by FairPrice AI seed (demo data).",
        insufficientQuality: false,
      },
    });

    const valuation = await prisma.valuation.create({
      data: {
        listingId: listing.id,
        userId: pick(users.users, i).id,
        productLabel: listing.productLabel,
        fairValueMinInr: fairMin,
        fairValueMaxInr: fairMax,
        fairValueMidInr: mid,
        recommendedListingInr: Math.round(mid * 1.05),
        expectedSaleMinInr: Math.round(mid * 0.92),
        expectedSaleMaxInr: Math.round(mid * 1.04),
        quickSaleInr: Math.round(mid * 0.85),
        conditionScore: score,
        priceConfidence: 0.45 + Math.random() * 0.4,
        marketDemandScore: 0.4 + Math.random() * 0.5,
        marketLiquidity: 0.35 + Math.random() * 0.5,
        depreciationEstimate: 0.15 + Math.random() * 0.35,
        marketTrend: pick(["up", "down", "stable"] as const, i),
        verdict: verdictFor(asking, mid),
        buyerVerdict: "Demo buyer guidance",
        sellerRecommendation: "Demo seller guidance — adjust toward fair mid if overpriced.",
        negotiationMinInr: Math.round(mid * 0.88),
        negotiationMaxInr: Math.round(mid * 0.98),
        explanation: "Deterministic demo valuation from FairPrice AI seed data.",
        sellerPriceInr: asking,
        comparableCount: randInt(4, 24),
        engineVersion: "v1",
        factors: {
          condition: score,
          demo: true,
        },
        factorRows: {
          create: [
            {
              name: "Condition",
              impactInr: Math.round((score - 70) * 100),
              impactPct: (score - 70) / 10,
              description: `Condition ${listing.conditionGrade}`,
            },
            {
              name: "Market comps",
              impactInr: 0,
              impactPct: 0,
              description: "Synthetic comparable set (isSynthetic)",
            },
          ],
        },
      },
    });
    void valuation;
  }
}

async function seedSocial(
  listings: Awaited<ReturnType<typeof seedListings>>,
  ctx: {
    buyer: { id: string };
    seller: { id: string };
    users: Array<{ id: string }>;
  },
) {
  console.log("Seeding conversations, messages, offers, reviews, favorites, notifications...");

  const buyers = ctx.users.filter((u) => u.id !== ctx.seller.id);
  let messageCount = 0;
  let offerCount = 0;
  const conversationIds: string[] = [];

  for (let i = 0; i < 55; i++) {
    const listing = listings[i]!;
    const buyer = i === 0 ? ctx.buyer : pick(buyers, i + 3);
    if (buyer.id === listing.sellerId) continue;

    const conversation = await prisma.conversation.create({
      data: {
        listingId: listing.id,
        buyerId: buyer.id,
        sellerId: listing.sellerId,
        lastMessageAt: new Date(),
      },
    });
    conversationIds.push(conversation.id);

    const baseMessages = [
      { senderId: buyer.id, body: `Hi! Is ${listing.title} still available? (demo chat)` },
      { senderId: listing.sellerId, body: "Yes, available. Happy to meet in a public place. Demo seed conversation." },
      { senderId: buyer.id, body: `What's your best price on this? Asking ₹${listing.priceInr}.` },
      { senderId: listing.sellerId, body: "I can negotiate a bit if you inspect in person." },
    ];

    if (i < SAFETY_PHRASES.length) {
      baseMessages.push({
        senderId: buyer.id,
        body: `[DEMO SAFETY TRIGGER] ${SAFETY_PHRASES[i]!}`,
      });
    } else if (i % 6 === 0) {
      baseMessages.push({
        senderId: listing.sellerId,
        body: "[DEMO] Please message me on WhatsApp for faster replies.",
      });
    }

    for (const m of baseMessages) {
      const isSafety = /OTP|QR|UPI PIN|WhatsApp|courier|gift/i.test(m.body);
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          senderId: m.senderId,
          body: m.body,
          riskScore: isSafety ? randInt(30, 85) : 0,
          riskFlags: isSafety ? ["demo_safety_trigger"] : [],
          safetyWarning: isSafety
            ? "Demo safety warning — review FairPrice AI chat guidelines."
            : null,
        },
      });
      messageCount++;
    }

    // Extra filler messages to exceed 100
    for (let j = 0; j < 2; j++) {
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          senderId: j % 2 === 0 ? buyer.id : listing.sellerId,
          body: `Demo follow-up message ${j + 1} about ${listing.title}.`,
        },
      });
      messageCount++;
    }

    if (i < 55) {
      const amount = Math.round(listing.priceInr * (0.85 + (i % 10) * 0.01));
      await prisma.offer.create({
        data: {
          listingId: listing.id,
          conversationId: conversation.id,
          buyerId: buyer.id,
          sellerId: listing.sellerId,
          amountInr: amount,
          message: "Demo offer — synthetic seed data",
          status: pick(
            [OfferStatus.PENDING, OfferStatus.ACCEPTED, OfferStatus.REJECTED, OfferStatus.COUNTERED] as const,
            i,
          ),
          expiresAt: new Date(Date.now() + 7 * 86400000),
        },
      });
      offerCount++;
    }
  }

  // Favorites
  for (let i = 0; i < 40; i++) {
    const listing = listings[i + 10]!;
    const user = pick(ctx.users, i);
    try {
      await prisma.favorite.create({
        data: { userId: user.id, listingId: listing.id },
      });
    } catch {
      /* unique collision ok */
    }
  }

  // Transactions + reviews
  for (let i = 0; i < 18; i++) {
    const listing = listings[i + 60]!;
    const buyer = pick(buyers, i + 20);
    if (buyer.id === listing.sellerId) continue;
    const tx = await prisma.transaction.create({
      data: {
        listingId: listing.id,
        buyerId: buyer.id,
        sellerId: listing.sellerId,
        amountInr: listing.priceInr,
        status: TransactionStatus.COMPLETED,
        completedAt: new Date(Date.now() - randInt(2, 40) * 86400000),
        notes: "Demo completed transaction (seed)",
      },
    });
    await prisma.review.create({
      data: {
        transactionId: tx.id,
        reviewerId: buyer.id,
        revieweeId: listing.sellerId,
        rating: randInt(3, 5),
        body: "Smooth deal — demo review from FairPrice AI seed data.",
        isVerified: true,
      },
    });
  }

  // Notifications
  const notifTypes: NotificationType[] = [
    NotificationType.NEW_MESSAGE,
    NotificationType.OFFER_RECEIVED,
    NotificationType.VALUATION_COMPLETED,
    NotificationType.PRICE_DROP,
    NotificationType.SYSTEM,
    NotificationType.FRAUD_WARNING,
  ];
  for (let i = 0; i < 60; i++) {
    const user = pick(ctx.users, i);
    await prisma.notification.create({
      data: {
        userId: user.id,
        type: pick(notifTypes, i),
        title: "FairPrice AI demo notification",
        body: "Synthetic seed notification — Know What It's Worth.",
        href: i % 2 === 0 ? "/marketplace" : "/messages",
        readAt: i % 3 === 0 ? new Date() : null,
      },
    });
  }

  console.log(`Messages: ${messageCount}, Offers: ${offerCount}, Conversations: ${conversationIds.length}`);
}

async function seedContent() {
  console.log("Seeding BlogPosts (5) and FAQs (15)...");
  const posts = [
    {
      title: "How FairPrice AI values used phones in India",
      slug: "how-fairprice-ai-values-used-phones",
      excerpt: "A look at comps, condition, and INR fair ranges.",
      content:
        "## Demo blog post\n\nFairPrice AI combines deterministic valuation with local market comps so you **Know What It's Worth** before you list or buy.\n\nThis is seed content for demos.",
    },
    {
      title: "Stay safe: OTP, QR, and UPI scam patterns",
      slug: "stay-safe-otp-qr-upi",
      excerpt: "Common chat red flags on Indian marketplaces.",
      content:
        "## Safety guide (demo)\n\nNever share OTPs or UPI PINs. Do not scan unknown QR codes. Prefer in-person public meetups.",
    },
    {
      title: "Pricing a used car in Hyderabad vs Bengaluru",
      slug: "pricing-used-car-hyd-blr",
      excerpt: "City demand shifts fair mid estimates.",
      content:
        "## City markets (demo)\n\nMetro demand slightly lifts fair value. Always inspect RC, insurance, and service history.",
    },
    {
      title: "Seller playbook: featured vs boosted listings",
      slug: "seller-playbook-featured-boosted",
      excerpt: "When promotions help clearance.",
      content:
        "## Promotions (demo)\n\nFeatured and boosted placements improve discovery for competitive categories like mobiles and gaming.",
    },
    {
      title: "Introducing Know What It's Worth",
      slug: "know-what-its-worth",
      excerpt: "The FairPrice AI brand promise.",
      content:
        "## Brand (demo)\n\nFairPrice AI helps India buy and sell second-hand goods with transparent valuations and fraud signals.",
    },
  ];

  for (const p of posts) {
    await prisma.blogPost.create({
      data: {
        ...p,
        coverUrl: PLACEHOLDER,
        authorName: "FairPrice AI Team",
        isPublished: true,
        publishedAt: new Date(),
      },
    });
  }

  const faqs: Array<{ category: string; question: string; answer: string }> = [
    { category: "General", question: "What is FairPrice AI?", answer: "India's AI-powered marketplace for smarter, safer reselling. Tagline: Know What It's Worth." },
    { category: "General", question: "Is this seed data real?", answer: "No. Seed listings, chats, and prices are synthetic demo data." },
    { category: "Valuation", question: "How does valuation work?", answer: "A deterministic engine uses comps, condition, age, location, and demand; AI adds explanation." },
    { category: "Valuation", question: "What is a fair price verdict?", answer: "UNDERPRICED, FAIR, SLIGHTLY_HIGH, OVERPRICED, or UNKNOWN based on asking vs fair mid." },
    { category: "Safety", question: "Will FairPrice ask for my OTP?", answer: "Never. OTP / UPI PIN requests are scam patterns flagged by message scanning." },
    { category: "Safety", question: "Should I scan a seller QR?", answer: "Avoid unknown QR codes; prefer verified in-person payment." },
    { category: "Safety", question: "Is WhatsApp safer?", answer: "Moving off-platform early reduces protections. Prefer in-app chat until meetup." },
    { category: "Selling", question: "How do I list an item?", answer: "Go to Sell, pick a category, add photos, run AI valuation, then publish." },
    { category: "Selling", question: "What is AI Verified?", answer: "A listing that passed automated condition/fraud checks with reasonable confidence." },
    { category: "Buying", question: "How do offers work?", answer: "Send an offer on a listing; sellers can accept, reject, or counter." },
    { category: "Account", question: "What are the demo accounts?", answer: "admin@fairprice.ai, buyer@demo.fairprice.ai, seller@demo.fairprice.ai — see README." },
    { category: "AI", question: "Do I need Ollama?", answer: "Optional. Without Ollama, MockAIProvider powers demos." },
    { category: "AI", question: "Which model is recommended?", answer: "qwen3.5:9b via Ollama for local inference." },
    { category: "Business", question: "Is there an API?", answer: "Yes — business API keys and /api/v1/valuation for partners." },
    { category: "Trust", question: "What is trust score?", answer: "A 0–100 signal based on verification, reviews, and fraud history." },
  ];

  for (let i = 0; i < faqs.length; i++) {
    const f = faqs[i]!;
    await prisma.fAQ.create({
      data: {
        category: f.category,
        question: f.question,
        answer: f.answer,
        sortOrder: i,
        isActive: true,
      },
    });
  }
}

async function main() {
  console.log("=== FairPrice AI seed starting ===");
  await clearDemoData();
  const categoryIds = await seedCategories();
  await seedCategoryAttributes(categoryIds);
  const userCtx = await seedUsers();
  const products = await seedProducts(categoryIds);
  await seedMarketData(products);
  const listings = await seedListings(products, userCtx);
  await seedValuationsAndCondition(listings, userCtx);
  await seedSocial(listings, userCtx);
  await seedContent();
  console.log("=== FairPrice AI seed complete ===");
  console.log("Demo accounts:");
  console.log("  admin@fairprice.ai / FairPriceAdmin123!");
  console.log("  buyer@demo.fairprice.ai / demo1234");
  console.log("  seller@demo.fairprice.ai / demo1234");
}

main()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
