import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="container-page flex min-h-[70vh] flex-col items-center justify-center py-16 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
        404
      </p>
      <h1 className="mt-3 font-display text-4xl font-bold tracking-tight md:text-5xl">
        Page not found
      </h1>
      <p className="mt-4 max-w-md text-foreground-muted">
        That link doesn&apos;t lead anywhere on FairPrice AI. Head back to the
        marketplace or run a FairPrice check.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button variant="lime" asChild>
          <Link href="/marketplace">Browse marketplace</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/value">Check FairPrice</Link>
        </Button>
        <Button variant="ghost" asChild>
          <Link href="/">Home</Link>
        </Button>
      </div>
    </div>
  );
}
