"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHero } from "@/components/layout/page-hero";
import { DashboardCard } from "@/components/admin/dashboard-card";
import { Button } from "@/components/ui/button";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { formatInr } from "@/lib/utils";

export default function SellerDashboardPage() {
  const router = useRouter();
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    (async () => {
      const res = await fetch("/api/dashboard/seller");
      if (res.status === 401) {
        router.push("/login?next=/dashboard");
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
        eyebrow="Seller"
        title="Seller dashboard"
        description="Track listings, views, and inbound offers."
      >
        <Button variant="lime" asChild>
          <Link href="/sell">Create listing</Link>
        </Button>
      </PageHero>
      <div className="container-page space-y-8 py-10">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <DashboardCard title="Active" value={String(stats.activeListings ?? 0)} />
          <DashboardCard title="Drafts" value={String(stats.draftListings ?? 0)} />
          <DashboardCard title="Views" value={String(stats.totalViews ?? 0)} />
          <DashboardCard title="Pending offers" value={String(stats.pendingOffers ?? 0)} />
        </div>
        <div className="rounded-2xl border border-border bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold">Recent listings</h2>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/listings">View all</Link>
            </Button>
          </div>
          <div className="space-y-3">
            {(data?.listings ?? []).slice(0, 8).map((l: any) => (
              <Link
                key={l.id}
                href={`/product/${l.id}`}
                className="flex items-center justify-between rounded-xl border border-border px-4 py-3 hover:bg-secondary/60"
              >
                <div>
                  <p className="font-medium">{l.title}</p>
                  <p className="text-xs text-foreground-muted">{l.status}</p>
                </div>
                <p className="font-semibold text-primary">{formatInr(l.priceInr)}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
