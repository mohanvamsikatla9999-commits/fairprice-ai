"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Eye, Package, Tag, MessageSquare,
  TrendingUp, Plus, ArrowRight, Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { formatInr } from "@/lib/utils";
import { cn } from "@/lib/utils";

type StatCard = {
  label: string;
  value: string;
  icon: React.ElementType;
  color: string;
  bg: string;
};

export default function SellerDashboardPage() {
  const router = useRouter();
  const [data, setData] = React.useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [userName, setUserName] = React.useState<string>("");

  React.useEffect(() => {
    (async () => {
      const [dashRes, meRes] = await Promise.all([
        fetch("/api/dashboard/seller"),
        fetch("/api/auth/me"),
      ]);
      if (dashRes.status === 401) {
        router.push("/login?next=/dashboard");
        return;
      }
      const dashJson = await dashRes.json();
      const meJson = await meRes.json();
      if (dashJson.ok) setData(dashJson.data);
      if (meJson.ok) {
        const u = meJson.data?.user;
        setUserName(u?.displayName || u?.name || "");
      }
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

  const stats = (data?.stats ?? {}) as Record<string, number>;
  const listings = (data?.listings ?? []) as Array<Record<string, unknown>>;

  const statCards: StatCard[] = [
    { label: "Active listings",  value: String(stats.activeListings ?? 0),  icon: Package,     color: "text-primary",  bg: "bg-primary/10" },
    { label: "Total views",      value: String(stats.totalViews ?? 0),      icon: Eye,         color: "text-blue-600", bg: "bg-blue-100" },
    { label: "Pending offers",   value: String(stats.pendingOffers ?? 0),   icon: Tag,         color: "text-amber-600",bg: "bg-amber-100" },
    { label: "Unread messages",  value: String(stats.unreadMessages ?? 0),  icon: MessageSquare, color: "text-green-600", bg: "bg-green-100" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f4f7ff] to-white">
      {/* Header */}
      <div className="border-b border-border/70 bg-white/80 backdrop-blur-sm">
        <div className="container-page py-7">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm text-foreground-muted">Welcome back</p>
              <h1 className="font-display text-2xl font-bold sm:text-3xl">
                {userName ? `Hi, ${userName.split(" ")[0]} 👋` : "Seller Dashboard"}
              </h1>
            </div>
            <Button variant="lime" size="lg" asChild>
              <Link href="/sell">
                <Plus className="h-4 w-4" />
                New listing
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="container-page py-8 space-y-8">
        {/* Stat cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((s) => (
            <div
              key={s.label}
              className="flex items-center gap-4 rounded-2xl border border-border bg-white p-5 shadow-sm"
            >
              <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-xl", s.bg)}>
                <s.icon className={cn("h-6 w-6", s.color)} />
              </div>
              <div>
                <p className="text-2xl font-bold font-display">{s.value}</p>
                <p className="text-sm text-foreground-muted">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { icon: Sparkles, label: "Check FairPrice", desc: "Get AI valuation for any item", href: "/value", color: "text-primary", bg: "bg-primary/10" },
            { icon: TrendingUp, label: "My listings", desc: "Manage all your active ads", href: "/my-listings", color: "text-green-600", bg: "bg-green-100" },
            { icon: MessageSquare, label: "Messages", desc: "Chat with buyers", href: "/messages", color: "text-blue-600", bg: "bg-blue-100" },
          ].map((a) => (
            <Link
              key={a.label}
              href={a.href}
              className="group flex items-center gap-4 rounded-2xl border border-border bg-white p-5 shadow-sm transition hover:border-primary/30 hover:shadow-md"
            >
              <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", a.bg)}>
                <a.icon className={cn("h-5 w-5", a.color)} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{a.label}</p>
                <p className="text-xs text-foreground-muted">{a.desc}</p>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-border transition group-hover:text-primary" />
            </Link>
          ))}
        </div>

        {/* Recent listings */}
        <div className="rounded-2xl border border-border bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <h2 className="font-display text-lg font-semibold">Recent listings</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/my-listings">
                View all
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>

          {listings.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                <Package className="h-8 w-8 text-primary" />
              </div>
              <div>
                <p className="font-semibold">No listings yet</p>
                <p className="mt-1 text-sm text-foreground-muted">
                  Create your first listing and let AI suggest the right price
                </p>
              </div>
              <Button asChild variant="lime">
                <Link href="/sell">
                  <Plus className="h-4 w-4" />
                  Create listing
                </Link>
              </Button>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {listings.slice(0, 8).map((l) => (
                <li key={String(l.id)}>
                  <Link
                    href={`/product/${String(l.id)}`}
                    className="flex items-center justify-between gap-4 px-6 py-4 transition hover:bg-secondary/40"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{String(l.title)}</p>
                      <span className={cn(
                        "mt-0.5 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold",
                        String(l.status) === "ACTIVE" ? "bg-green-100 text-green-700" :
                        String(l.status) === "DRAFT"  ? "bg-gray-100 text-gray-600"  :
                        "bg-amber-100 text-amber-700",
                      )}>
                        {String(l.status)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <p className="font-bold text-primary">{formatInr(Number(l.priceInr))}</p>
                      <ArrowRight className="h-4 w-4 text-border" />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
