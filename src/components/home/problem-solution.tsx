import { Ban, Scale, Sparkles } from "lucide-react";
import { SectionHeading } from "@/components/shared/section-heading";

export function ProblemSolution() {
  return (
    <section className="container-page py-20">
      <SectionHeading
        eyebrow="The problem"
        title="Second-hand pricing is guesswork."
        description="Buyers overpay. Sellers underprice. Trust erodes. FairPrice AI closes the gap with transparent market valuations."
      />
      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {[
          {
            icon: Ban,
            title: "Opaque asking prices",
            body: "Listings rarely explain why a price is fair — so every negotiation starts from doubt.",
          },
          {
            icon: Scale,
            title: "Uneven information",
            body: "Experienced sellers know comps. Everyday buyers and first-time sellers do not.",
          },
          {
            icon: Sparkles,
            title: "AI that levels the field",
            body: "FairPrice estimates a realistic range, recommended ask, and quick-sale floor — in plain language.",
          },
        ].map((item) => (
          <div
            key={item.title}
            className="rounded-2xl border border-border bg-white p-6 shadow-sm transition hover:border-primary/20 hover:shadow-md"
          >
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <item.icon className="h-5 w-5" />
            </div>
            <h3 className="font-display text-lg font-semibold">{item.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-foreground-muted">{item.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
