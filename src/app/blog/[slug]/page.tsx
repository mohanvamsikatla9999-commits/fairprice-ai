import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clock, BookOpen } from "lucide-react";
import { MarketingPage } from "@/components/layout/marketing-page";
import { Button } from "@/components/ui/button";

type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  readMins: number;
  publishedAt: string;
  body: string[][];  // array of [heading, content] pairs
};

const POSTS: BlogPost[] = [
  {
    slug: "fair-price-basics",
    title: "What makes a price fair?",
    excerpt: "How comps, condition, and demand shape second-hand value in India.",
    readMins: 4,
    publishedAt: "2026-06-10",
    body: [
      ["The problem with guessing", "Most second-hand deals in India are priced by gut feeling. The seller thinks about what they paid; the buyer thinks about what they could get elsewhere. Neither side has data, so negotiation is a guessing game where one party always feels cheated."],
      ["What actually drives resale value", "Three factors matter most: comparable sales (what similar items actually sold for recently), condition (visible wear, functional state, accessories), and demand (how quickly similar items are moving in your city). FairPrice AI weighs all three before producing an estimate."],
      ["Comparable sales: the backbone", "A comparable is a real transaction or recent listing of the same product in a similar condition. A POCO M7 6GB/128GB sold two weeks ago in Hyderabad is a strong comparable. A different brand at the same price is not. The more exact the match, the more reliable the estimate."],
      ["Condition multiplier", "Condition grade moves the price band significantly. A Like New device commands 75–90% of MRP; a Good device 55–70%; a Poor device 30–45%. These ranges reflect real Indian market patterns, not arbitrary discounts."],
      ["Demand and liquidity", "High-demand products (flagship phones, popular laptops) sell faster and hold value better. Low-demand items (niche electronics, older models) take longer and often need deeper discounts. FairPrice AI factors in category-level demand when building the range."],
      ["The fair range, not a single price", "A truly fair price is always a range, not a number. ₹8,500–₹10,200 is more honest than ₹9,350. The range reflects real market dispersion — the same phone in similar condition genuinely sells across that band depending on the buyer and timing."],
      ["How to use this", "When you see a FairPrice range, the recommended listing price sits near the high end of fair — a reasonable starting point. The quick-sale price targets a faster close. If you're a buyer, a fair offer lands near the midpoint. Both sides can negotiate from a shared reality."],
    ],
  },
  {
    slug: "safe-meetup-checklist",
    title: "Safe meetup checklist",
    excerpt: "Practical steps before you buy or sell locally in India.",
    readMins: 3,
    publishedAt: "2026-07-02",
    body: [
      ["Why meetup safety matters", "Most second-hand fraud in India happens at or just before meetup. Payment scams, fake inspection, item switching, and identity fraud all have simple countermeasures — if you know them."],
      ["Before you agree to meet", "Verify the listing was created by a phone-verified seller. Check the FairPrice score — significantly overpriced items are a fraud signal. Read reviews and trust score. If the seller insists on WhatsApp-only communication, treat it as a red flag."],
      ["Choose your meeting spot", "Meet in a well-lit, busy public location during daylight hours. Police stations, bank ATM lobbies, shopping mall food courts, and metro station exits are all ideal. Never go to a stranger's home or an isolated location for a first meetup."],
      ["Payment rules", "Pay only after physically inspecting the item in working condition. Never pay a 'booking advance' to hold an item — legitimate sellers don't require this. Prefer UPI face-to-face (scan and pay after inspection). Never share your UPI PIN, CVV, or OTP with anyone."],
      ["Inspecting the item", "For phones: check IMEI (Settings → About → IMEI) matches the box, test all hardware (camera, speakers, buttons), check battery health, and verify IMEI is not blacklisted. For laptops: boot to OS, check battery cycles, test all ports. For appliances: plug in and run a test cycle."],
      ["Documents for vehicles", "Always check RC (Registration Certificate), insurance papers, and NOC if applicable. Verify the seller's name on RC matches their ID. Run an RTO check on the vehicle number. Never transfer payment before completing RTO transfer formalities."],
      ["If something feels wrong", "Trust your instincts. If the seller is rushed, evasive about the item's history, or insists on unusual payment methods, walk away. Report the listing immediately from the product page. Your report helps protect other buyers."],
    ],
  },
  {
    slug: "ai-valuation-explained",
    title: "AI valuation explained",
    excerpt: "Inside FairPrice AI's pricing engine — what it does and what it doesn't.",
    readMins: 5,
    publishedAt: "2026-07-18",
    body: [
      ["Two layers: engine and AI", "FairPrice AI uses a two-layer approach. The first layer is a deterministic engine that calculates price ranges from real data — comparable listings, MRP references, condition scores, and location adjustments. The second layer is Gemini AI, which explains those numbers in plain language."],
      ["The deterministic engine", "The engine works like an appraiser, not a chatbot. It starts with a known MRP anchor (what the product costs new), applies a depreciation curve based on age and category, blends in real comparable listings from the marketplace, and adjusts for location (metro cities command slightly higher prices)."],
      ["How comparables are selected", "Not all listings are valid comparables. The engine filters aggressively: the product must match brand and model, the condition grade must be close, and the price must fall within the MRP band for that product. A POCO M7 should never be compared to an iPhone listing at a similar price."],
      ["Condition scoring", "Condition grade alone isn't enough — the engine maps grades to numeric scores (Like New = 95, Excellent = 85, Good = 70, Fair = 55, Poor = 35) and uses those scores in the depreciation calculation. A 'Good' phone is not just a label — it shifts the anchor by a measurable percentage."],
      ["What Gemini AI adds", "Gemini doesn't invent prices — it explains the ones the engine produced. Given the product label, MRP, fair range, condition, age, comparables count, and market trend, Gemini writes the explanation ('The original price was ₹X; after 14 months in Good condition it has depreciated ~42%…'), buyer verdict, seller tip, and negotiation talking points."],
      ["What it can't do", "The engine will not produce a result when evidence is insufficient. If a product can't be identified, if there are no comparable listings, and no MRP reference is available, it returns INSUFFICIENT_DATA rather than inventing a number. This is intentional — a wrong number is worse than no number."],
      ["Confidence and what it means", "Every result includes a confidence score. High confidence means strong identity match + multiple real comparables + a reliable MRP reference. Low confidence means sparse data. Use low-confidence estimates as a rough signal, not a final price."],
    ],
  },
];

type Ctx = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return POSTS.map((p) => ({ slug: p.slug }));
}

export default async function BlogPostPage({ params }: Ctx) {
  const { slug } = await params;
  const post = POSTS.find((p) => p.slug === slug);
  if (!post) notFound();

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f4f7ff] to-white pb-16">
      {/* Hero */}
      <div className="hero-blue">
        <div className="container-page max-w-3xl py-12 text-white">
          <Button asChild variant="ghost" size="sm" className="mb-5 text-white/70 hover:text-white hover:bg-white/10">
            <Link href="/blog">
              <ArrowLeft className="h-4 w-4" />
              All posts
            </Link>
          </Button>
          <div className="flex flex-wrap gap-3 text-xs text-white/60 mb-3">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {post.readMins} min read
            </span>
            <span className="flex items-center gap-1">
              <BookOpen className="h-3.5 w-3.5" />
              {new Date(post.publishedAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
            </span>
          </div>
          <h1 className="font-display text-3xl font-bold sm:text-4xl">{post.title}</h1>
          <p className="mt-3 text-white/80">{post.excerpt}</p>
        </div>
      </div>

      {/* Body */}
      <div className="container-page max-w-3xl py-10">
        <div className="rounded-2xl border border-border bg-white p-8 shadow-sm">
          <div className="space-y-8">
            {post.body.map(([heading, content]) => (
              <section key={heading}>
                <h2 className="font-display text-xl font-semibold text-foreground">{heading}</h2>
                <p className="mt-2 leading-relaxed text-foreground-muted">{content}</p>
              </section>
            ))}
          </div>

          <div className="mt-10 border-t border-border pt-6">
            <p className="text-xs text-foreground-muted">
              FairPrice AI · {new Date(post.publishedAt).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button asChild variant="lime">
                <Link href="/value">Try FairPrice AI</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/blog">More posts</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
