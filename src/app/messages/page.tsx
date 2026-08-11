"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHero } from "@/components/layout/page-hero";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { formatRelative } from "@/lib/utils";

export default function MessagesPage() {
  const router = useRouter();
  const [items, setItems] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [meId, setMeId] = React.useState<string | null>(null);

  React.useEffect(() => {
    (async () => {
      const me = await fetch("/api/auth/me");
      const meJson = await me.json();
      if (!meJson.ok) {
        router.push("/login?next=/messages");
        return;
      }
      setMeId(meJson.data.user.id);
      const res = await fetch("/api/conversations");
      const json = await res.json();
      if (json.ok) setItems(json.data.items);
      setLoading(false);
    })();
  }, [router]);

  return (
    <>
      <PageHero
        eyebrow="Inbox"
        title="Messages"
        description="Chats with buyers and sellers on your listings."
      />
      <div className="container-page py-10">
        {loading ? (
          <LoadingSkeleton variant="lines" />
        ) : items.length === 0 ? (
          <EmptyState
            title="No conversations yet"
            description="Start a chat from any product page."
            actionLabel="Browse marketplace"
            onAction={() => router.push("/marketplace")}
          />
        ) : (
          <div className="space-y-3">
            {items.map((c) => {
              const other =
                meId === c.buyerId
                  ? c.seller
                  : c.buyer;
              const last = c.messages?.[0];
              return (
                <Link
                  key={c.id}
                  href={`/messages/${c.id}`}
                  className="flex items-center justify-between rounded-2xl border border-border bg-white px-5 py-4 hover:border-primary/30"
                >
                  <div>
                    <p className="font-medium">
                      {other?.displayName || other?.name || "User"} · {c.listing?.title}
                    </p>
                    <p className="mt-1 line-clamp-1 text-sm text-foreground-muted">
                      {last?.body ?? "No messages yet"}
                    </p>
                  </div>
                  <span className="text-xs text-foreground-muted">
                    {c.lastMessageAt ? formatRelative(c.lastMessageAt) : ""}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
