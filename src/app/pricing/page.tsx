import Link from "next/link";
import { Check, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const PLANS = [
  {
    name: "Free",
    price: "₹0",
    period: "forever",
    desc: "For individual buyers and sellers",
    highlight: false,
    features: [
      "Unlimited listings",
      "AI photo scan & product detection",
      "FairPrice AI valuations",
      "Gemini-powered explanations",
      "Chat with buyers and sellers",
      "Phone OTP verification",
      "Face verification (fraud protection)",
      "50+ cities",
      "Price alerts",
    ],
    cta: { label: "Get started free", href: "/register" },
  },
  {
    name: "Boost",
    price: "₹99",
    period: "per listing / 7 days",
    desc: "For faster individual sales",
    highlight: false,
    features: [
      "Everything in Free",
      "Boosted placement in search results",
      "Listed before non-boosted items",
    ],
    cta: { label: "Boost a listing", href: "/my-listings" },
  },
  {
    name: "Featured",
    price: "₹249",
    period: "per listing / 7 days",
    desc: "Maximum visibility for high-value items",
    highlight: true,
    features: [
      "Everything in Boost",
      "Featured badge on listing card",
      "Top placement in category browse",
      "Highlighted in home page deals",
    ],
    cta: { label: "Feature a listing", href: "/my-listings" },
  },
  {
    name: "Business",
    price: "Custom",
    period: "monthly",
    desc: "For dealers, platforms, and resellers",
    highlight: false,
    features: [
      "Bulk valuation API",
      "High monthly quota",
      "Business verification badge",
      "Priority support",
      "Dedicated account manager",
      "Custom integration support",
    ],
    cta: { label: "Contact us", href: "/for-business" },
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f4f7ff] to-white pb-16">
      <div className="hero-blue">
        <div className="container-page py-16 text-white text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-accent">Pricing</p>
          <h1 className="mt-3 font-display text-4xl font-bold sm:text-5xl">Simple, transparent pricing</h1>
          <p className="mt-4 text-white/80 max-w-lg mx-auto">
            Core features are free forever. Pay only when you want extra visibility.
          </p>
        </div>
      </div>

      <div className="container-page py-12">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {PLANS.map((plan) => (
            <div key={plan.name} className={cn(
              "flex flex-col rounded-2xl border p-6 shadow-sm",
              plan.highlight ? "border-primary bg-primary/5 ring-2 ring-primary" : "border-border bg-white",
            )}>
              {plan.highlight && (
                <div className="mb-3 inline-flex items-center gap-1 self-start rounded-full bg-accent px-2.5 py-1 text-xs font-bold text-accent-foreground">
                  <Zap className="h-3 w-3" /> Most popular
                </div>
              )}
              <h3 className="font-display text-xl font-bold">{plan.name}</h3>
              <div className="mt-2">
                <span className="font-display text-3xl font-bold">{plan.price}</span>
                <span className="ml-1.5 text-sm text-foreground-muted">/ {plan.period}</span>
              </div>
              <p className="mt-1 text-sm text-foreground-muted">{plan.desc}</p>
              <ul className="mt-5 flex-1 space-y-2.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button asChild className="mt-6" variant={plan.highlight ? "lime" : "outline"}>
                <Link href={plan.cta.href}>{plan.cta.label}</Link>
              </Button>
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-2xl border border-border bg-white p-8 text-center shadow-sm">
          <h2 className="font-display text-2xl font-bold">All prices in INR · No hidden fees</h2>
          <p className="mt-2 text-foreground-muted">
            Payment processing fee may apply. Listing boosts and featured placements are single-item,
            fixed-duration purchases — no recurring subscription.
          </p>
          <p className="mt-3 text-sm text-foreground-muted">
            For bulk pricing or enterprise plans, <Link href="/contact" className="text-primary hover:underline">contact us</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
