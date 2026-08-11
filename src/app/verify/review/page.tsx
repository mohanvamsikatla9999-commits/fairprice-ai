"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";

function Inner() {
  const id = useSearchParams().get("id");
  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-12">
      <div className="w-full max-w-md rounded-2xl border border-border bg-white p-8 text-center shadow-sm">
        <h1 className="font-display text-3xl font-bold">Under review</h1>
        <p className="mt-2 text-sm text-foreground-muted">
          A specialist will review your verification metadata. Biometric images are not retained for
          admin browsing by default.
        </p>
        {id ? (
          <p className="mt-3 text-xs text-foreground-muted">Case linked to {id.slice(0, 10)}…</p>
        ) : null}
        <Button asChild variant="lime" className="mt-6">
          <Link href="/verify/history">View history</Link>
        </Button>
      </div>
    </div>
  );
}

export default function VerifyReviewPage() {
  return (
    <Suspense>
      <Inner />
    </Suspense>
  );
}
