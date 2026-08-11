import { Lock, ShieldCheck, UserCheck } from "lucide-react";
import { SectionHeading } from "@/components/shared/section-heading";
import { SafetyWarning } from "@/components/trust/safety-warning";

export function TrustSection() {
  return (
    <section className="container-page py-20">
      <div className="grid items-center gap-10 lg:grid-cols-2">
        <div>
          <SectionHeading
            eyebrow="Trust & safety"
            title="Trade with clearer signals."
            description="FairPrice AI layers verification cues, reporting, and practical safety guidance into every listing."
          />
          <ul className="mt-8 space-y-4">
            {[
              {
                icon: ShieldCheck,
                title: "Seller trust badges",
                body: "See verification status and trust scores before you message.",
              },
              {
                icon: UserCheck,
                title: "Identity-aware profiles",
                body: "Account history and reputation help you spot serious counterparties.",
              },
              {
                icon: Lock,
                title: "Safer meetups",
                body: "In-product reminders for public handovers and payment hygiene.",
              },
            ].map((item) => (
              <li key={item.title} className="flex gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <item.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold">{item.title}</p>
                  <p className="text-sm text-foreground-muted">{item.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-4">
          <SafetyWarning
            severity="warning"
            title="Never pay outside the platform’s guidance"
            message="Prefer traceable payments and public meetup spots. If a deal feels rushed or secretive, walk away and report the listing."
          />
          <SafetyWarning
            severity="info"
            title="Use FairPrice as context, not pressure"
            message="Valuations are market estimates. Use them to negotiate calmly — not to shame buyers or sellers."
          />
        </div>
      </div>
    </section>
  );
}
