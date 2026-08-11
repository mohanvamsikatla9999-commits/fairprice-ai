import { MarketingPage } from "@/components/layout/marketing-page";

export default function Page() {
  return (
    <MarketingPage
      eyebrow="Legal"
      title="Community guidelines"
      description="FairPrice AI community guidelines."
    >
      <div className="prose prose-neutral max-w-3xl space-y-4 text-foreground-muted">
        <p>These community guidelines apply to use of FairPrice AI websites, apps, and APIs.</p><p>Contact legal@fairprice.ai for questions.</p>
      </div>
    </MarketingPage>
  );
}
