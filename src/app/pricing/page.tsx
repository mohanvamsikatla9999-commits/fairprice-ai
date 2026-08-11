import { MarketingPage } from "@/components/layout/marketing-page";

export default function Page() {
  return (
    <MarketingPage
      eyebrow="Product"
      title="Pricing"
      description="Free for individuals. Business API plans for inventory teams."
    >
      <div className="prose prose-neutral max-w-3xl space-y-4 text-foreground-muted">
        <p>Core valuation and marketplace features are free. Businesses can upgrade for API quotas.</p>
      </div>
    </MarketingPage>
  );
}
