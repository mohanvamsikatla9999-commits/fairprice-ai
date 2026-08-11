import { MarketingPage } from "@/components/layout/marketing-page";

export default function Page() {
  return (
    <MarketingPage
      eyebrow="Trust"
      title="Trust & verification"
      description="Trust scores, verification levels, and fraud signals keep the marketplace safer."
    >
      <div className="prose prose-neutral max-w-3xl space-y-4 text-foreground-muted">
        <p>Verified sellers earn higher visibility. High-risk listings are held for moderation.</p>
      </div>
    </MarketingPage>
  );
}
