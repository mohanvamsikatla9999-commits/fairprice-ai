import { MarketingPage } from "@/components/layout/marketing-page";

export default function Page() {
  return (
    <MarketingPage
      eyebrow="Company"
      title="About FairPrice AI"
      description="India's AI-powered marketplace for smarter, safer reselling."
    >
      <div className="prose prose-neutral max-w-3xl space-y-4 text-foreground-muted">
        <p>We believe every buyer and seller deserves transparent pricing.</p>
      </div>
    </MarketingPage>
  );
}
