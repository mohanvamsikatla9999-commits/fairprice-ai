import { MarketingPage } from "@/components/layout/marketing-page";

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const title = slug
    .split("-")
    .map((w) => w[0]?.toUpperCase() + w.slice(1))
    .join(" ");
  return (
    <MarketingPage eyebrow="Blog" title={title} description="FairPrice AI editorial.">
      <article className="max-w-3xl space-y-4 text-foreground-muted">
        <p>
          This article covers {title.toLowerCase()} in the context of India&apos;s
          second-hand marketplace. Use FairPrice AI valuations before you commit to a
          deal.
        </p>
        <p>
          Always verify condition in person, prefer public meeting spots, and report
          suspicious behaviour from the product or chat screens.
        </p>
      </article>
    </MarketingPage>
  );
}
