"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

function Inner() {
  const params = useSearchParams();
  const id = params.get("id");
  const [reason, setReason] = React.useState(
    "I believe my verification attempt should be reviewed.",
  );
  const [message, setMessage] = React.useState<string | null>(null);

  async function requestReview() {
    if (!id) return;
    const res = await fetch(`/api/verification/${id}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });
    const json = await res.json();
    setMessage(json.ok ? "Review requested." : json.error?.message);
  }

  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-12">
      <div className="w-full max-w-md rounded-2xl border border-border bg-white p-8 shadow-sm">
        <h1 className="font-display text-3xl font-bold">Verification couldn&apos;t be completed</h1>
        <p className="mt-2 text-sm text-foreground-muted">
          You can retry, contact support, or request a manual review. For privacy and security, we
          don&apos;t share internal check details.
        </p>
        <div className="mt-6 space-y-3">
          <Button asChild variant="lime" className="w-full">
            <Link href="/verify/identity">Retry</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/contact">Contact support</Link>
          </Button>
        </div>
        <div className="mt-6 space-y-2">
          <p className="text-sm font-medium">Request review</p>
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} />
          <Button className="w-full" variant="soft" onClick={requestReview} disabled={!id}>
            Request review
          </Button>
          {message ? <p className="text-sm text-foreground-muted">{message}</p> : null}
        </div>
      </div>
    </div>
  );
}

export default function VerifyFailedPage() {
  return (
    <Suspense>
      <Inner />
    </Suspense>
  );
}
