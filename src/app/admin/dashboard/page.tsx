"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { DashboardCard } from "@/components/admin/dashboard-card";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { Button } from "@/components/ui/button";

export default function AdminPage() {
  const router = useRouter();
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    (async () => {
      const res = await fetch("/api/admin/stats");
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
        <h1 className="font-display text-2xl font-bold">Admin dashboard</h1>
        <p className="mt-2 text-sm text-destructive">{error}</p>
        <Button className="mt-4" onClick={() => router.push("/login")}>Sign in</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Admin dashboard</h1>
        <p className="mt-1 text-sm text-foreground-muted">Admin console</p>
      </div>
      {data?.stats ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Object.entries(data.stats).map(([k, v]) => (
            <DashboardCard key={k} title={k} value={String(v)} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
