import { MarketingPage } from "@/components/layout/marketing-page";

export default function Page() {
  return (
    <MarketingPage
      eyebrow="Trust"
      title="Safety centre"
      description="Practical guidance for safer local deals across India."
    >
      <div className="prose prose-neutral max-w-3xl space-y-4 text-foreground-muted">
        <p>Meet in public places, never share OTPs, and use FairPrice AI warnings in chat.</p><p>Report suspicious listings immediately from the product page.</p>
      </div>
    </MarketingPage>
  );
}
