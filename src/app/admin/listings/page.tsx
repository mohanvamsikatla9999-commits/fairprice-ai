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
      const res = await fetch("/api/admin/listings");
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
        <h1 className="font-display text-2xl font-bold">Listings</h1>
        <p className="mt-2 text-sm text-destructive">{error}</p>
        <Button className="mt-4" onClick={() => router.push("/login")}>Sign in</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Listings</h1>
        <p className="mt-1 text-sm text-foreground-muted">Admin console</p>
      </div>
      <div className="space-y-3">
        {(data?.listings ?? []).map((l: any) => (
          <div key={l.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-white px-5 py-4">
            <div>
              <p className="font-medium">{l.title}</p>
              <p className="text-xs text-foreground-muted">{l.status} · {l.seller?.email}</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                await fetch("/api/admin/listings", {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ listingId: l.id, status: l.status === "ACTIVE" ? "PAUSED" : "ACTIVE" }),
                });
                window.location.reload();
              }}
            >
              Toggle active
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
