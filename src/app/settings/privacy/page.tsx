"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function SettingsPrivacyPage() {
  const router = useRouter();
  const [status, setStatus] = React.useState<any>(null);
  const [message, setMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    (async () => {
      const res = await fetch("/api/verification");
      if (res.status === 401) {
        router.push("/login?next=/settings/privacy");
        return;
      }
      const json = await res.json();
      if (json.ok) setStatus(json.data);
    })();
  }, [router]);

  async function requestDeletion() {
    const res = await fetch("/api/verification/deletion-request", { method: "POST" });
    const json = await res.json();
    setMessage(
      json.ok
        ? "Deletion/anonymization request recorded. Legal retention may apply to audit records."
        : json.error?.message,
    );
  }

  return (
    <div className="container-page max-w-2xl py-12">
      <h1 className="font-display text-3xl font-bold">Privacy</h1>
      <p className="mt-2 text-sm text-foreground-muted">
        FairPrice ID is privacy-first: capture → process → verify → discard temporary biometric data.
      </p>
      <div className="mt-8 space-y-4 rounded-2xl border border-border bg-white p-6 text-sm leading-relaxed">
        <p>
          <strong>Status:</strong> Level {status?.fairPriceIdLevel ?? "—"}
        </p>
        <p>
          We store verification status, provider, timestamps, method, and risk classification — not
          raw face images by default.
        </p>
        <p>
          Consent version used for biometric processing is recorded. You may withdraw future
          processing; past audit metadata may be retained where required.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Button asChild variant="outline">
            <Link href="/verify/history">Consent & history</Link>
          </Button>
          <Button variant="soft" onClick={requestDeletion}>
            Request verification data deletion
          </Button>
          <Button asChild variant="ghost">
            <Link href="/settings">Account deletion</Link>
          </Button>
        </div>
        {message ? <p className="text-foreground-muted">{message}</p> : null}
      </div>
    </div>
  );
}
