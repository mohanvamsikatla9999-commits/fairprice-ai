import Link from "next/link";
import { Code2, BarChart2, ShieldCheck, Palette, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";

const ROLES = [
  { icon: Code2, team: "Engineering", title: "Senior Full-Stack Engineer", type: "Full-time · Remote India", desc: "Build the valuation engine, AI pipelines, and marketplace infrastructure using Next.js, TypeScript, and Prisma." },
  { icon: Code2, team: "Engineering", title: "AI / ML Engineer", type: "Full-time · Remote India", desc: "Work on the FairPrice valuation model — improving comparables selection, depreciation curves, and Gemini integration." },
  { icon: ShieldCheck, team: "Trust & Safety", title: "Trust Operations Analyst", type: "Full-time · Hyderabad", desc: "Review verification cases, investigate fraud signals, and improve our safety playbook for Indian marketplace dynamics." },
  { icon: BarChart2, team: "Data", title: "Data Engineer", type: "Full-time · Remote India", desc: "Build and maintain the market comparables pipeline — collecting, cleaning, and serving pricing data for the valuation engine." },
  { icon: Palette, team: "Design", title: "Product Designer", type: "Full-time · Remote India", desc: "Design the buyer and seller experience end-to-end — from onboarding to valuation result to safe transaction." },
  { icon: Megaphone, team: "Growth", title: "Community & Growth Manager", type: "Full-time · Hyderabad", desc: "Grow the FairPrice AI seller and buyer community across Hyderabad, Bengaluru, and Mumbai." },
];

const BENEFITS = [
  "Fully remote or hybrid (Hyderabad HQ)",
  "Competitive market salary + equity",
  "₹50,000 learning budget per year",
  "Health insurance for you and family",
  "Flexible working hours",
  "MacBook or equivalent hardware",
  "30 days paid leave",
  "Real ownership — small team, big impact",
];

export default function CareersPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f4f7ff] to-white pb-16">
      <div className="hero-blue">
        <div className="container-page py-16 text-white">
          <p className="text-xs font-semibold uppercase tracking-widest text-accent">Careers</p>
          <h1 className="mt-3 font-display text-4xl font-bold sm:text-5xl">Build India&apos;s fair pricing layer</h1>
          <p className="mt-4 max-w-xl text-white/80">
            We&apos;re a small team solving a big problem. If you want real ownership and real impact
            on India&apos;s second-hand economy, we want to hear from you.
          </p>
          <Button asChild variant="lime" size="lg" className="mt-7">
            <a href="mailto:careers@fairprice.ai">Apply now</a>
          </Button>
        </div>
      </div>

      {/* Open roles */}
      <div className="container-page py-14">
        <h2 className="mb-8 font-display text-2xl font-bold">Open roles</h2>
        <div className="space-y-4">
          {ROLES.map((role) => (
            <div key={role.title} className="flex flex-col gap-3 rounded-2xl border border-border bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <role.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{role.title}</h3>
                    <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-foreground-muted">{role.team}</span>
                  </div>
                  <p className="text-xs text-foreground-muted mt-0.5">{role.type}</p>
                  <p className="mt-1.5 text-sm text-foreground-muted">{role.desc}</p>
                </div>
              </div>
              <Button asChild variant="outline" size="sm" className="shrink-0">
                <a href={`mailto:careers@fairprice.ai?subject=Application: ${role.title}`}>Apply</a>
              </Button>
            </div>
          ))}
        </div>
        <p className="mt-5 text-sm text-foreground-muted">
          Don&apos;t see your role? Send a speculative application to <a href="mailto:careers@fairprice.ai" className="text-primary hover:underline">careers@fairprice.ai</a> with your background.
        </p>
      </div>

      {/* Benefits */}
      <div className="border-t border-border bg-white">
        <div className="container-page py-14">
          <h2 className="mb-8 font-display text-2xl font-bold">Benefits</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {BENEFITS.map((b) => (
              <div key={b} className="flex items-center gap-2 rounded-xl border border-border p-3 text-sm">
                <span className="h-2 w-2 shrink-0 rounded-full bg-accent" />
                {b}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
