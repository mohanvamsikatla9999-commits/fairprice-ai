import { MarketingPage } from "@/components/layout/marketing-page";

export default function Page() {
  return (
    <MarketingPage
      eyebrow="API"
      title="Developer portal"
      description="Integrate FairPrice valuation into your product."
    >
      <div className="prose prose-neutral max-w-3xl space-y-4 text-foreground-muted">
        <p>Authenticate with X-API-Key and POST product attributes to /api/v1/valuation.</p>
      </div>
    </MarketingPage>
  );
}
