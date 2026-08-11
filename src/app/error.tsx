"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[FairPrice AI]", error);
  }, [error]);

  return (
    <div className="container-page flex min-h-[70vh] flex-col items-center justify-center py-16 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-destructive">
        Something went wrong
      </p>
      <h1 className="mt-3 font-display text-4xl font-bold tracking-tight md:text-5xl">
        We hit a snag
      </h1>
      <p className="mt-4 max-w-md text-foreground-muted">
        FairPrice AI couldn&apos;t finish that request. Try again, or return home
        while we sort it out.
      </p>
      {error.digest ? (
        <p className="mt-2 text-xs text-foreground-muted">Ref: {error.digest}</p>
      ) : null}
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button variant="lime" onClick={reset}>
          Try again
        </Button>
        <Button variant="outline" asChild>
          <Link href="/">Go home</Link>
        </Button>
      </div>
    </div>
  );
}
