import Link from "next/link";
import { PageHero } from "@/components/layout/page-hero";
import { Button } from "@/components/ui/button";

export function MarketingPage({
  eyebrow,
  title,
  description,
  children,
  cta,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: React.ReactNode;
  cta?: { href: string; label: string };
}) {
  return (
    <>
      <PageHero eyebrow={eyebrow} title={title} description={description}>
        {cta ? (
          <Button variant="lime" asChild>
            <Link href={cta.href}>{cta.label}</Link>
          </Button>
        ) : null}
      </PageHero>
      <div className="container-page py-12">{children}</div>
    </>
  );
}
