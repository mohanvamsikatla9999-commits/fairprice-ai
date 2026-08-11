import { MarketingPage } from "@/components/layout/marketing-page";

export default function Page() {
  return (
    <MarketingPage
      eyebrow="Product"
      title="How it works"
      description="FairPrice AI checks market comps, condition, and demand before you buy or sell."
    >
      <div className="prose prose-neutral max-w-3xl space-y-4 text-foreground-muted">
        <p>1. Describe or list an item.</p><p>2. FairPrice AI estimates a fair value band.</p><p>3. Negotiate with confidence and meet safely.</p>
      </div>
    </MarketingPage>
  );
}
