import { MarketingPage } from "@/components/layout/marketing-page";

export default function Page() {
  return (
    <MarketingPage
      eyebrow="API"
      title="FairPrice API"
      description="Public marketing for the FairPrice valuation API."
    >
      <div className="prose prose-neutral max-w-3xl space-y-4 text-foreground-muted">
        <p>Get fair value bands, verdicts, and negotiation ranges programmatically.</p><p>Visit /developer for technical details or /for-business to request access.</p>
      </div>
    </MarketingPage>
  );
}
