"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { Button } from "@/components/ui/button";

export default function AdminPage() {
  const router = useRouter();
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    (async () => {
      const res = await fetch("/api/admin/reports");
      if (res.status === 401 || res.status === 403) {
        router.push("/login?next=/admin/dashboard");
        return;
      }
      const json = await res.json();
      if (!json.ok) setError(json.error?.message ?? "Failed to load");
      else setData(json.data);
      setLoading(false);
    })();
  }, [router]);

  if (loading) return <LoadingSkeleton variant="cards" />;
  if (error) {
    return (
      <div className="rounded-2xl border border-border bg-white p-8">
        <h1 className="font-display text-2xl font-bold">Reports</h1>
        <p className="mt-2 text-sm text-destructive">{error}</p>
        <Button className="mt-4" onClick={() => router.push("/login")}>Sign in</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Reports</h1>
        <p className="mt-1 text-sm text-foreground-muted">Admin console</p>
      </div>
      <div className="space-y-3">
        {(data?.reports ?? []).map((r: any) => (
          <div key={r.id} className="rounded-2xl border border-border bg-white px-5 py-4">
            <p className="font-medium">{r.targetType}: {r.reason}</p>
            <p className="text-sm text-foreground-muted">{r.status} · {r.reporter?.email}</p>
            <div className="mt-3 flex gap-2">
              <Button size="sm" variant="outline" onClick={async () => {
                await fetch("/api/admin/reports", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reportId: r.id, status: "ACTION_TAKEN", resolution: "Actioned by admin" }) });
                window.location.reload();
              }}>Resolve</Button>
              <Button size="sm" variant="ghost" onClick={async () => {
                await fetch("/api/admin/reports", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reportId: r.id, status: "DISMISSED" }) });
                window.location.reload();
              }}>Dismiss</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
