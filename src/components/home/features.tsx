import { Gauge, ShieldCheck, Tags, Zap } from "lucide-react";
import { SectionHeading } from "@/components/shared/section-heading";

const FEATURES = [
  {
    icon: Gauge,
    title: "Price meter",
    body: "See where an asking price sits vs. the fair band — underpriced to overpriced, without the hype.",
  },
  {
    icon: Tags,
    title: "Smart listing guidance",
    body: "Recommended ask, expected selling price, and quick-sale floor for every category we cover.",
  },
  {
    icon: ShieldCheck,
    title: "Trust signals",
    body: "Verified sellers, safety tips, and reporting tools built into every conversation.",
  },
  {
    icon: Zap,
    title: "Faster negotiations",
    body: "Shared valuation context means fewer lowball wars and clearer counters.",
  },
];

export function Features() {
  return (
    <section className="container-page py-20">
      <SectionHeading
        eyebrow="Features"
        title="Built for fairer marketplace decisions."
        description="Premium valuation tools that feel simple — designed for India’s resale reality."
      />
      <div className="mt-12 grid gap-5 sm:grid-cols-2">
        {FEATURES.map((feature) => (
          <div
            key={feature.title}
            className="group rounded-2xl border border-border bg-white p-6 transition hover:border-primary/25 hover:shadow-lg"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white shadow-md shadow-primary/25 transition group-hover:scale-105">
              <feature.icon className="h-5 w-5" />
            </div>
            <h3 className="font-display text-xl font-semibold">{feature.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-foreground-muted">
              {feature.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
