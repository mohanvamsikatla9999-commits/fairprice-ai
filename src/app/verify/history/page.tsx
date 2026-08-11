"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function VerifyHistoryPage() {
  const router = useRouter();
  const [history, setHistory] = React.useState<
    Array<{ id: string; status: string; createdAt: string; isDevelopment: boolean }>
  >([]);

  React.useEffect(() => {
    (async () => {
      const res = await fetch("/api/verification/history");
      if (res.status === 401) {
        router.push("/login?next=/verify/history");
        return;
      }
      const json = await res.json();
      if (json.ok) setHistory(json.data.history);
    })();
  }, [router]);

  return (
    <div className="container-page max-w-2xl py-12">
      <h1 className="font-display text-3xl font-bold">Verification history</h1>
      <p className="mt-2 text-sm text-foreground-muted">
        Status and timestamps only — no biometric material is shown here.
      </p>
      <div className="mt-6 space-y-3">
        {history.length === 0 ? (
          <p className="text-sm text-foreground-muted">No verification attempts yet.</p>
        ) : (
          history.map((row) => (
            <div key={row.id} className="rounded-xl border border-border bg-white px-4 py-3">
              <p className="font-medium">{row.status}</p>
              <p className="text-xs text-foreground-muted">
                {new Date(row.createdAt).toLocaleString()}
                {row.isDevelopment ? " · Development verification" : ""}
              </p>
            </div>
          ))
        )}
      </div>
      <Button asChild variant="outline" className="mt-6">
        <Link href="/verify">Back to FairPrice ID</Link>
      </Button>
    </div>
  );
}
