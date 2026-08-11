import { MarketingPage } from "@/components/layout/marketing-page";

export default function Page() {
  return (
    <MarketingPage
      eyebrow="Support"
      title="Help centre"
      description="Answers for buyers, sellers, and businesses."
    >
      <div className="prose prose-neutral max-w-3xl space-y-4 text-foreground-muted">
        <p>Start with How it works, Safety, or Contact support for account issues.</p>
      </div>
    </MarketingPage>
  );
}
