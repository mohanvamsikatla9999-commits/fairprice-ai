export const siteConfig = {
  name: "FairPrice AI",
  shortName: "FairPrice",
  tagline: "Know What It's Worth.",
  description:
    "India's AI-powered marketplace for smarter, safer reselling. Get fair valuations, detect fraud, and negotiate with confidence.",
  url: "https://fairprice.ai",
  locale: "en-IN",
  currency: "INR",
} as const;

export type NavLink = {
  title: string;
  href: string;
  description?: string;
};

export const mainNav: NavLink[] = [
  { title: "Browse", href: "/marketplace", description: "Explore listings across India" },
  { title: "Sell", href: "/sell", description: "List an item with AI pricing" },
  { title: "Valuation", href: "/value", description: "Know what it's worth" },
  { title: "Safety", href: "/safety", description: "Buy and sell safely" },
  { title: "How it works", href: "/how-it-works" },
  { title: "Pricing", href: "/pricing" },
];

export const categoryNav: NavLink[] = [
  { title: "Mobiles", href: "/category/mobiles" },
  { title: "Laptops", href: "/category/laptops" },
  { title: "Cars", href: "/category/cars" },
  { title: "Bikes", href: "/category/bikes" },
  { title: "Furniture", href: "/category/furniture" },
  { title: "Electronics", href: "/category/electronics" },
];

export type CategoryDef = {
  name: string;
  slug: string;
  icon: string;
  description: string;
};

export const categories: CategoryDef[] = [
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
  { name: "Services", slug: "services", icon: "briefcase", description: "Local services" },
  { name: "Collectibles", slug: "collectibles", icon: "gem", description: "Collectibles and antiques" },
  { name: "Other", slug: "other", icon: "package", description: "Everything else" },
];

export const socialLinks = {
  twitter: "https://twitter.com/fairpriceai",
  instagram: "https://instagram.com/fairpriceai",
  linkedin: "https://linkedin.com/company/fairpriceai",
  youtube: "https://youtube.com/@fairpriceai",
  github: "https://github.com/fairprice-ai",
} as const;

export const footerLinks = {
  product: [
    { title: "Browse", href: "/marketplace" },
    { title: "Sell an item", href: "/sell" },
    { title: "AI Valuation", href: "/value" },
    { title: "Price alerts", href: "/dashboard/buyer" },
    { title: "Business API", href: "/for-business" },
  ],
  company: [
    { title: "About", href: "/about" },
    { title: "Blog", href: "/blog" },
    { title: "Careers", href: "/careers" },
    { title: "Contact", href: "/contact" },
  ],
  safety: [
    { title: "Safety centre", href: "/safety" },
    { title: "Trust", href: "/trust" },
    { title: "Community guidelines", href: "/community-guidelines" },
    { title: "Safety guidelines", href: "/safety-guidelines" },
  ],
  legal: [
    { title: "Terms of service", href: "/terms" },
    { title: "Privacy policy", href: "/privacy" },
    { title: "Cookie policy", href: "/cookies" },
    { title: "Refund policy", href: "/refund-policy" },
  ],
  support: [
    { title: "Help centre", href: "/help" },
    { title: "How it works", href: "/how-it-works" },
    { title: "Developers", href: "/developers" },
    { title: "Contact support", href: "/contact" },
  ],
} as const;

export type SiteConfig = typeof siteConfig;
