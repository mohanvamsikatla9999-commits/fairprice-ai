import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function PropertyJobsWaitlistPage() {
  return (
    <div className="container-page flex min-h-[60vh] items-center justify-center py-16">
      <div className="max-w-lg rounded-2xl border border-border bg-white p-8 text-center shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          Coming soon
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold">
          Property & Jobs on FairPrice
        </h1>
        <p className="mt-3 text-sm text-foreground-muted">
          We&apos;re preparing guided property and jobs flows with the same FairPrice
          honesty model. Meanwhile, sell goods locally with AI fair pricing.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button asChild variant="lime">
            <Link href="/sell">Sell something else</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/marketplace">Browse marketplace</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
