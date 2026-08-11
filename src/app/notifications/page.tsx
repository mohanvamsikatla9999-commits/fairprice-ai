"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHero } from "@/components/layout/page-hero";
import { Button } from "@/components/ui/button";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { formatRelative } from "@/lib/utils";

export default function NotificationsPage() {
  const router = useRouter();
  const [items, setItems] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  async function load() {
    const res = await fetch("/api/notifications");
    if (res.status === 401) {
      router.push("/login?next=/notifications");
      return;
    }
    const json = await res.json();
    if (json.ok) setItems(json.data.items);
    setLoading(false);
  }

  React.useEffect(() => {
    void load();
  }, [router]);

  async function markAll() {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
    await load();
  }

  return (
    <>
      <PageHero eyebrow="Account" title="Notifications" description="Offers, messages, and system updates.">
        <Button variant="outline" onClick={() => void markAll()}>
          Mark all read
        </Button>
      </PageHero>
      <div className="container-page py-10">
        {loading ? (
          <LoadingSkeleton variant="lines" />
        ) : items.length === 0 ? (
          <EmptyState title="You're all caught up" description="New activity will show up here." />
        ) : (
          <div className="space-y-3">
            {items.map((n) => (
              <div
                key={n.id}
                className={`rounded-2xl border border-border bg-white px-5 py-4 ${n.readAt ? "opacity-70" : ""}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{n.title}</p>
                    <p className="mt-1 text-sm text-foreground-muted">{n.body}</p>
                    {n.href ? (
                      <Link href={n.href} className="mt-2 inline-block text-sm text-primary hover:underline">
                        Open
                      </Link>
                    ) : null}
                  </div>
                  <span className="text-xs text-foreground-muted">{formatRelative(n.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
