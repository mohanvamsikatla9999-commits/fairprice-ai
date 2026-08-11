"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHero } from "@/components/layout/page-hero";
import { DashboardCard } from "@/components/admin/dashboard-card";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { formatInr } from "@/lib/utils";

export default function BuyerDashboardPage() {
  const router = useRouter();
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    (async () => {
      const res = await fetch("/api/dashboard/buyer");
      if (res.status === 401) {
        router.push("/login?next=/dashboard/buyer");
        return;
      }
      const json = await res.json();
      if (json.ok) setData(json.data);
      setLoading(false);
    })();
  }, [router]);

  if (loading) {
    return (
      <div className="container-page py-10">
        <LoadingSkeleton variant="cards" />
      </div>
    );
  }

  const stats = data?.stats ?? {};

  return (
    <>
      <PageHero
        eyebrow="Buyer"
        title="Buyer hub"
        description="Saved items, offers you sent, and price alerts."
      />
      <div className="container-page space-y-8 py-10">
        <div className="grid gap-4 sm:grid-cols-3">
          <DashboardCard title="Wishlist" value={String(stats.favorites ?? 0)} />
          <DashboardCard title="Active offers" value={String(stats.activeOffers ?? 0)} />
          <DashboardCard title="Price alerts" value={String(stats.priceAlerts ?? 0)} />
        </div>
        <div className="rounded-2xl border border-border bg-white p-6">
          <h2 className="mb-4 font-display text-xl font-semibold">Your offers</h2>
          <div className="space-y-3">
            {(data?.offers ?? []).map((o: any) => (
              <div key={o.id} className="flex justify-between rounded-xl border border-border px-4 py-3">
                <div>
                  <p className="font-medium">{o.listing?.title}</p>
                  <p className="text-xs text-foreground-muted">{o.status}</p>
                </div>
                <p className="font-semibold">{formatInr(o.amountInr)}</p>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <Link href="/wishlist" className="text-sm text-primary hover:underline">
              Open wishlist
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
