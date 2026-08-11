import { MarketingPage } from "@/components/layout/marketing-page";

export default function Page() {
  return (
    <MarketingPage
      eyebrow="Support"
      title="Contact"
      description="We usually reply within one business day."
    >
      <div className="prose prose-neutral max-w-3xl space-y-4 text-foreground-muted">
        <p>Email support@fairprice.ai or use in-app report tools for urgent safety issues.</p>
      </div>
    </MarketingPage>
  );
}
