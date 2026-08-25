import Link from "next/link";
import { Tag, Sparkles, ShieldCheck, MessageSquare, CheckCircle2, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";

const SELLER_STEPS = [
  { n: "1", icon: Camera, title: "Snap photos or type", body: "Upload photos of your item. Gemini AI identifies the product, fills specs automatically, and suggests a listing title." },
  { n: "2", icon: Sparkles, title: "Get AI FairPrice", body: "See the original MRP, depreciation estimate, fair second-hand range, and a recommended listing price — all from real market data." },
  { n: "3", icon: Tag, title: "Publish your listing", body: "One-tap publish. Your listing goes live with condition grade, specs, and location. Buyers see the FairPrice badge." },
  { n: "4", icon: MessageSquare, title: "Chat and close", body: "Buyers message you directly. Share your verified phone for calls. Mark the item sold when done." },
];

const BUYER_STEPS = [
  { n: "1", icon: Sparkles, title: "Check FairPrice first", body: "Before buying anything, enter the product name and get the real market range. Know if the asking price is fair, high, or a steal." },
  { n: "2", icon: ShieldCheck, title: "Check the seller", body: "Every listing shows a trust score, verification level, and review history. FairPrice AI flags listings with fraud signals automatically." },
  { n: "3", icon: MessageSquare, title: "Negotiate with data", body: "Use the negotiation talking points from our AI. Counter-offer with the exact fair range — both parties see the same numbers." },
  { n: "4", icon: CheckCircle2, title: "Meet safely and pay", body: "Meet in public. Inspect before paying. Use our safe meetup checklist and FairPrice Assist for high-value deals." },
];

const FAQS = [
  { q: "Is FairPrice AI free to use?", a: "Yes. Listing, browsing, messaging, and AI valuations are all free for individuals. We plan paid features for businesses (bulk API, promoted listings) in the future." },
  { q: "How accurate are the valuations?", a: "Accuracy depends on data quality. When we have strong comparable listings and a known MRP, confidence is high (70–90%). For rare or new products, confidence may be lower and we say so explicitly." },
  { q: "Does FairPrice AI store my face images?", a: "No. Face images are sent to Gemini for analysis and immediately discarded. We store only the verification outcome, timestamp, and risk classification." },
  { q: "Can I list without AI valuation?", a: "Yes. You can set your own price. The AI valuation is optional — though we recommend it for faster sales." },
  { q: "What happens if a deal goes wrong?", a: "Use the Report button on any listing. Our trust team reviews reports within 24 hours. For high-value deals, FairPrice Assist provides a structured inspection flow." },
];

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f4f7ff] to-white pb-16">
      <div className="hero-blue">
        <div className="container-page py-16 text-white">
          <p className="text-xs font-semibold uppercase tracking-widest text-accent">Product</p>
          <h1 className="mt-3 font-display text-4xl font-bold sm:text-5xl">How FairPrice AI works</h1>
          <p className="mt-4 max-w-xl text-white/80">
            From listing to deal — AI-powered at every step. Here&apos;s exactly what happens.
          </p>
        </div>
      </div>

      <div className="container-page py-14">
        <div className="grid gap-16 lg:grid-cols-2">
          {/* Sellers */}
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-4 py-1.5 text-sm font-semibold">
              <Tag className="h-4 w-4" /> For sellers
            </div>
            <div className="space-y-6">
              {SELLER_STEPS.map((s) => (
                <div key={s.n} className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-white font-bold font-display">
                    {s.n}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <s.icon className="h-4 w-4 text-primary" />
                      <h3 className="font-semibold">{s.title}</h3>
                    </div>
                    <p className="mt-1 text-sm text-foreground-muted">{s.body}</p>
                  </div>
                </div>
              ))}
            </div>
            <Button asChild variant="lime" size="lg" className="mt-6"><Link href="/sell">Start selling</Link></Button>
          </div>

          {/* Buyers */}
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5 text-sm font-semibold text-primary">
              <ShieldCheck className="h-4 w-4" /> For buyers
            </div>
            <div className="space-y-6">
              {BUYER_STEPS.map((s) => (
                <div key={s.n} className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold font-display">
                    {s.n}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <s.icon className="h-4 w-4 text-primary" />
                      <h3 className="font-semibold">{s.title}</h3>
                    </div>
                    <p className="mt-1 text-sm text-foreground-muted">{s.body}</p>
                  </div>
                </div>
              ))}
            </div>
            <Button asChild variant="outline" size="lg" className="mt-6"><Link href="/marketplace">Browse listings</Link></Button>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="border-t border-border bg-white">
        <div className="container-page py-14">
          <h2 className="mb-8 font-display text-2xl font-bold">Frequently asked questions</h2>
          <div className="mx-auto max-w-3xl space-y-5">
            {FAQS.map((faq) => (
              <div key={faq.q} className="rounded-2xl border border-border p-5">
                <p className="font-semibold">{faq.q}</p>
                <p className="mt-2 text-sm text-foreground-muted">{faq.a}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <p className="text-foreground-muted text-sm">More questions?</p>
            <Button asChild variant="outline" className="mt-2"><Link href="/help">Visit Help centre</Link></Button>
          </div>
        </div>
      </div>
    </div>
  );
}
