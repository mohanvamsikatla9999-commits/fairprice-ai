import { SectionHeading } from "@/components/shared/section-heading";

const TESTIMONIALS = [
  {
    quote:
      "I almost listed my MacBook ₹12K too low. FairPrice showed the range and I sold within a week at a better number.",
    name: "Ananya R.",
    role: "Seller · Hyderabad",
  },
  {
    quote:
      "Finally a marketplace that tells you when something is overpriced before you waste time negotiating.",
    name: "Karthik M.",
    role: "Buyer · Bengaluru",
  },
  {
    quote:
      "The price meter made the conversation civil. Both of us could see the fair band and meet in the middle.",
    name: "Neha S.",
    role: "Buyer · Mumbai",
  },
];

export function Testimonials() {
  return (
    <section className="bg-background-muted py-20">
      <div className="container-page">
        <SectionHeading
          align="center"
          eyebrow="Stories"
          title="Fairer deals, happier trades."
          description="Real outcomes from buyers and sellers using FairPrice AI."
        />
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <blockquote
              key={t.name}
              className="flex h-full flex-col rounded-3xl border border-border bg-white p-6 shadow-sm"
            >
              <p className="flex-1 text-base leading-relaxed text-foreground">
                “{t.quote}”
              </p>
              <footer className="mt-6 border-t border-border pt-4">
                <p className="font-display font-semibold">{t.name}</p>
                <p className="text-sm text-foreground-muted">{t.role}</p>
              </footer>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}
