import Link from "next/link";
import { MarketingPage } from "@/components/layout/marketing-page";

const POSTS = [
  { slug: "fair-price-basics", title: "What makes a price fair?", excerpt: "How comps, condition, and demand shape value." },
  { slug: "safe-meetup-checklist", title: "Safe meetup checklist", excerpt: "Practical steps before you buy or sell locally." },
  { slug: "ai-valuation-explained", title: "AI valuation explained", excerpt: "Inside FairPrice AI's pricing engine." },
];

export default function BlogPage() {
  return (
    <MarketingPage eyebrow="Blog" title="Insights from FairPrice AI" description="Pricing, trust, and marketplace tips.">
      <div className="grid gap-4 md:grid-cols-3">
        {POSTS.map((post) => (
          <Link key={post.slug} href={`/blog/${post.slug}`} className="rounded-2xl border border-border bg-white p-5 transition hover:border-primary/30 hover:shadow-md">
            <h2 className="font-display text-lg font-semibold">{post.title}</h2>
            <p className="mt-2 text-sm text-foreground-muted">{post.excerpt}</p>
          </Link>
        ))}
      </div>
    </MarketingPage>
  );
}
