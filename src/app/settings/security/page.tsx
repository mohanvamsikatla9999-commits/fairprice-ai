"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function SettingsSecurityPage() {
  const router = useRouter();
  const [lockedUntil, setLockedUntil] = React.useState<string | null>(null);
  const [requiresReverification, setRequiresReverification] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      const res = await fetch("/api/verification");
      if (res.status === 401) {
        router.push("/login?next=/settings/security");
        return;
      }
      const json = await res.json();
      if (json.ok) {
        setLockedUntil(json.data.lockedUntil);
        setRequiresReverification(json.data.requiresReverification);
      }
    })();
  }, [router]);

  return (
    <div className="container-page max-w-2xl py-12">
      <h1 className="font-display text-3xl font-bold">Security</h1>
      <p className="mt-2 text-sm text-foreground-muted">
        Account takeover protection and verification locks.
      </p>
      <div className="mt-8 space-y-4 rounded-2xl border border-border bg-white p-6 text-sm">
        <p>
          Verification lock:{" "}
          {lockedUntil ? `Active until ${new Date(lockedUntil).toLocaleString()}` : "None"}
        </p>
        <p>
          Re-verification required: {requiresReverification ? "Yes — identity details changed" : "No"}
        </p>
        <p className="text-foreground-muted">
          Suspicious logins, device changes, or identity field edits may require additional
          verification. We do not auto-ban from a single weak signal.
        </p>
        <Button asChild variant="outline">
          <Link href="/verify">Open FairPrice ID</Link>
        </Button>
      </div>
    </div>
  );
}
