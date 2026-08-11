import { Camera, LineChart, MessageCircleHeart } from "lucide-react";
import { SectionHeading } from "@/components/shared/section-heading";

const STEPS = [
  {
    step: "01",
    icon: Camera,
    title: "Describe your item",
    body: "Add photos, model, condition, and location. Takes under a minute.",
  },
  {
    step: "02",
    icon: LineChart,
    title: "Get a FairPrice report",
    body: "See fair range, recommended listing price, demand, and confidence.",
  },
  {
    step: "03",
    icon: MessageCircleHeart,
    title: "List, negotiate, close",
    body: "Publish with transparency badges and chat with serious buyers.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-background-muted py-20">
      <div className="container-page">
        <SectionHeading
          align="center"
          eyebrow="How it works"
          title="From photo to fair deal."
          description="Three steps to price with confidence — whether you’re buying or selling."
        />
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {STEPS.map((step) => (
            <div
              key={step.step}
              className="relative rounded-3xl border border-border bg-white p-7 shadow-sm"
            >
              <span className="font-display text-5xl font-bold text-primary/15">
                {step.step}
              </span>
              <div className="mt-4 flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                <step.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-display text-xl font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-foreground-muted">{step.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
