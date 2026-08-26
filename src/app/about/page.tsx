import Link from "next/link";
import { Sparkles, ShieldCheck, TrendingUp, Users, MapPin, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const VALUES = [
  { icon: Sparkles, title: "AI-first transparency", body: "Every valuation shows the evidence: comparables used, depreciation %, confidence score. No black box — just data." },
  { icon: ShieldCheck, title: "Safety by design", body: "Fraud signals, verified sellers, face verification, and safe meetup tools are built into every transaction flow." },
  { icon: TrendingUp, title: "Fair to both sides", body: "Buyers see if a price is overpriced. Sellers know what to list at. The same AI serves both parties equally." },
  { icon: MapPin, title: "Built for India", body: "Prices calibrated to Indian cities, rupee markets, Indian carrier networks, and local deal culture from day one." },
];

const TEAM = [
  { name: "Engineering", desc: "Building the valuation engine, AI pipelines, and marketplace infrastructure." },
  { name: "Trust & Safety", desc: "Fighting fraud, verifying identities, and making every deal safer." },
  { name: "Product", desc: "Designing the buyer and seller experience across web and mobile." },
  { name: "Data", desc: "Maintaining market comparables, MRP catalog, and pricing intelligence." },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f4f7ff] to-white">
      {/* Hero */}
      <div className="hero-blue">
        <div className="container-page py-20 text-white">
          <p className="text-xs font-semibold uppercase tracking-widest text-accent">About us</p>
          <h1 className="mt-3 font-display text-5xl font-bold leading-tight sm:text-6xl">
            India&apos;s marketplace<br />built on fair prices
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-white/80">
            FairPrice AI was built to solve a simple problem: nobody in India&apos;s second-hand market
            knows what anything is actually worth. We fix that with AI, real market data, and a
            transparent platform.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild variant="lime" size="lg"><Link href="/marketplace">Browse marketplace</Link></Button>
            <Button asChild size="lg" variant="outline" className="border-white/40 bg-white/10 text-white hover:bg-white hover:text-primary"><Link href="/value">Check a price</Link></Button>
          </div>
        </div>
      </div>

      {/* Mission */}
      <div className="container-page py-16">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">Our mission</p>
          <h2 className="mt-3 font-display text-3xl font-bold">
            Every buyer and seller deserves to know what it&apos;s really worth
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-foreground-muted">
            India&apos;s second-hand economy is worth ₹1.5 lakh crore but runs on gut instinct, WhatsApp
            price checks, and misinformation. Sellers underprice because they don&apos;t know better.
            Buyers overpay because they have no reference. FairPrice AI changes that with
            evidence-based valuations powered by Gemini AI and real market comparables.
          </p>
        </div>
      </div>

      {/* Values */}
      <div className="border-y border-border bg-white">
        <div className="container-page py-16">
          <h2 className="mb-10 text-center font-display text-2xl font-bold">What we stand for</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map((v) => (
              <div key={v.title} className="rounded-2xl border border-border p-6">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <v.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-display font-semibold">{v.title}</h3>
                <p className="mt-2 text-sm text-foreground-muted">{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="container-page py-16">
        <div className="grid gap-6 rounded-3xl bg-gradient-to-br from-primary to-primary-bright p-8 text-white sm:grid-cols-4">
          {[
            { value: "50+", label: "Cities covered" },
            { value: "₹0", label: "Listing fee" },
            { value: "Gemini", label: "AI provider" },
            { value: "100%", label: "Real listings" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className="font-display text-3xl font-bold">{s.value}</p>
              <p className="mt-1 text-sm text-white/75">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Team */}
      <div className="border-t border-border bg-white">
        <div className="container-page py-16">
          <h2 className="mb-2 font-display text-2xl font-bold">Our teams</h2>
          <p className="mb-8 text-foreground-muted">Small, focused teams working on hard problems.</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {TEAM.map((t) => (
              <div key={t.name} className="rounded-2xl border border-border p-5">
                <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-accent/20">
                  <Zap className="h-4 w-4 text-accent-foreground" />
                </div>
                <h3 className="font-semibold">{t.name}</h3>
                <p className="mt-1 text-sm text-foreground-muted">{t.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 rounded-2xl border border-primary/20 bg-primary/5 p-6 text-center">
            <p className="font-semibold">Want to join us?</p>
            <p className="mt-1 text-sm text-foreground-muted">We&apos;re hiring engineers, designers, and trust specialists.</p>
            <Button asChild className="mt-4" variant="lime"><Link href="/careers">View open roles</Link></Button>
          </div>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="container-page py-8 flex flex-wrap gap-4 items-center justify-between">
          <p className="text-sm text-foreground-muted">Questions? Email <a href="mailto:hello@fairprice.ai" className="text-primary hover:underline">hello@fairprice.ai</a></p>
          <div className="flex gap-3">
            <Button asChild variant="outline" size="sm"><Link href="/how-it-works">How it works</Link></Button>
            <Button asChild variant="outline" size="sm"><Link href="/safety">Safety centre</Link></Button>
          </div>
        </div>
      </div>
    </div>
  );
}
