import { MarketingPage } from "@/components/layout/marketing-page";

export default function Page() {
  return (
    <MarketingPage
      eyebrow="Company"
      title="Careers"
      description="Build the pricing layer for India's second-hand economy."
    >
      <div className="prose prose-neutral max-w-3xl space-y-4 text-foreground-muted">
        <p>We hire engineers, designers, and trust specialists. Write to careers@fairprice.ai.</p>
      </div>
    </MarketingPage>
  );
}
