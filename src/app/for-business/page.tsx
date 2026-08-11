import { MarketingPage } from "@/components/layout/marketing-page";

export default function Page() {
  return (
    <MarketingPage
      eyebrow="Business"
      title="FairPrice for business"
      description="Bulk valuations, API access, and trust tooling for dealers and platforms."
    >
      <div className="prose prose-neutral max-w-3xl space-y-4 text-foreground-muted">
        <p>Integrate /api/v1/valuation with your API key. Manage keys from Settings after upgrading to BUSINESS.</p>
      </div>
    </MarketingPage>
  );
}
