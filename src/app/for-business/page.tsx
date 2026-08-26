import Link from "next/link";
import { Zap, BarChart2, ShieldCheck, Key, Headphones, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const FEATURES = [
  { icon: Zap, title: "Bulk valuation API", body: "POST /api/v1/valuation with your API key. Get FairPrice ranges, confidence, and comparables for thousands of items per day." },
  { icon: BarChart2, title: "Market intelligence", body: "Access price snapshots, depreciation curves, and demand scores for 500+ products across Indian cities." },
  { icon: ShieldCheck, title: "Trust signals", body: "Run fraud checks and seller verification lookups as part of your own platform's trust infrastructure." },
  { icon: Key, title: "API key management", body: "Create, rotate, and scope API keys from your dashboard. Monitor usage, latency, and quota in real time." },
  { icon: Headphones, title: "Priority support", body: "Dedicated account manager, SLA-backed response times, and direct engineering support for integrations." },
];

const USE_CASES = [
  { title: "Used phone dealers", desc: "Bulk-price incoming trade-ins against the FairPrice range before making an offer." },
  { title: "Refurbishers", desc: "Automatically price graded devices at LIKE_NEW, EXCELLENT, GOOD condition levels." },
  { title: "Classifieds platforms", desc: "Add FairPrice badges to every listing without building your own valuation engine." },
  { title: "Insurance platforms", desc: "Get depreciated replacement value for gadget and electronics claims." },
  { title: "Fintech & BNPL", desc: "Use FairPrice fair value as collateral reference for device-backed loans." },
];

export default function ForBusinessPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f4f7ff] to-white pb-16">
      <div className="hero-blue">
        <div className="container-page py-16 text-white">
          <p className="text-xs font-semibold uppercase tracking-widest text-accent">Business</p>
          <h1 className="mt-3 font-display text-4xl font-bold sm:text-5xl">FairPrice AI for business</h1>
          <p className="mt-4 max-w-xl text-white/80">
            Bulk valuations, fraud detection, and market intelligence — via API — for dealers,
            platforms, and resellers across India.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button asChild variant="lime" size="lg"><Link href="/contact">Request API access</Link></Button>
            <Button asChild size="lg" variant="outline" className="border-white/40 bg-white/10 text-white hover:bg-white hover:text-primary"><Link href="/developers">API docs</Link></Button>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="container-page py-14">
        <h2 className="mb-8 font-display text-2xl font-bold">What you get</h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-2xl border border-border bg-white p-5 shadow-sm">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <f.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-foreground-muted">{f.body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* API example */}
      <div className="border-y border-border bg-secondary/30">
        <div className="container-page py-14">
          <div className="grid gap-10 lg:grid-cols-2">
            <div>
              <h2 className="font-display text-2xl font-bold">Simple REST API</h2>
              <p className="mt-3 text-foreground-muted">
                One endpoint, one API key, structured JSON response.
                Integrate in under an hour.
              </p>
              <ul className="mt-5 space-y-2">
                {["REST + JSON", "Gemini AI explanations", "India-calibrated pricing", "SLA 99.9% uptime", "INR-native responses"].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl bg-zinc-950 p-5 font-mono text-sm text-green-400 overflow-x-auto">
              <p className="text-zinc-500 mb-2"># POST /api/v1/valuation</p>
              <pre>{`{
  "title": "POCO M7 6GB/128GB",
  "categorySlug": "mobiles",
  "conditionGrade": "GOOD",
  "ageMonths": 10,
  "city": "Hyderabad"
}`}</pre>
              <p className="text-zinc-500 mt-3 mb-2"># Response</p>
              <pre>{`{
  "fairRangeMinInr": 7500,
  "fairRangeMaxInr": 9200,
  "recommendedListingInr": 8800,
  "confidence": 0.82,
  "verdict": "FAIR"
}`}</pre>
            </div>
          </div>
        </div>
      </div>

      {/* Use cases */}
      <div className="container-page py-14">
        <h2 className="mb-8 font-display text-2xl font-bold">Use cases</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {USE_CASES.map((u) => (
            <div key={u.title} className="rounded-xl border border-border bg-white p-5">
              <p className="font-semibold">{u.title}</p>
              <p className="mt-1 text-sm text-foreground-muted">{u.desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 rounded-2xl border border-primary/20 bg-primary/5 p-8 text-center">
          <h2 className="font-display text-2xl font-bold">Ready to integrate?</h2>
          <p className="mt-2 text-foreground-muted">Contact us for pricing, quota, and onboarding.</p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Button asChild variant="lime" size="lg"><Link href="/contact">Get in touch</Link></Button>
            <Button asChild variant="outline" size="lg"><Link href="/developers">Read the docs</Link></Button>
          </div>
        </div>
      </div>
    </div>
  );
}
