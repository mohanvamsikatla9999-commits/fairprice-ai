"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { ChatWindow } from "@/components/chat/chat-window";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { SafetyWarning } from "@/components/trust/safety-warning";
import { Button } from "@/components/ui/button";

export default function ConversationPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [meId, setMeId] = React.useState<string | null>(null);
  const [messages, setMessages] = React.useState<any[]>([]);
  const [meta, setMeta] = React.useState<{ title: string; subtitle?: string }>({
    title: "Conversation",
  });
  const [loading, setLoading] = React.useState(true);
  const [warning, setWarning] = React.useState<string | null>(null);
  const [canned, setCanned] = React.useState<string[]>([]);
  const [meetupPlaces, setMeetupPlaces] = React.useState<string[]>([]);
  const [canMarkSold, setCanMarkSold] = React.useState(false);

  async function load() {
    const me = await fetch("/api/auth/me");
    const meJson = await me.json();
    if (!meJson.ok) {
      router.push(`/login?next=/messages/${id}`);
      return;
    }
    setMeId(meJson.data.user.id);

    const [msgRes, listRes, actRes] = await Promise.all([
      fetch(`/api/conversations/${id}/messages`),
      fetch("/api/conversations"),
      fetch(`/api/conversations/${id}/actions`),
    ]);
    const msgJson = await msgRes.json();
    const listJson = await listRes.json();
    const actJson = await actRes.json();
    if (msgJson.ok) setMessages(msgJson.data.messages);
    if (listJson.ok) {
      const conv = listJson.data.items.find((c: any) => c.id === id);
      if (conv) {
        const other =
          meJson.data.user.id === conv.buyerId ? conv.seller : conv.buyer;
        setMeta({
          title: other?.displayName || other?.name || "Chat",
          subtitle: conv.listing?.title,
        });
      }
    }
    if (actJson.ok) {
      setCanned(actJson.data.cannedReplies ?? []);
      setMeetupPlaces(actJson.data.meetupPlaces ?? []);
      setCanMarkSold(Boolean(actJson.data.canMarkSold));
    }
    setLoading(false);
  }

  React.useEffect(() => {
    void load();
  }, [id, router]);

  async function send(body: string) {
    const res = await fetch(`/api/conversations/${id}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });
    const json = await res.json();
    if (json.ok) {
      setMessages((prev) => [...prev, json.data.message]);
      if (json.data.message?.safetyWarning) {
        setWarning(json.data.message.safetyWarning);
      }
    }
  }

  async function runAction(
    action: string,
    extra?: Record<string, string>,
  ) {
    const res = await fetch(`/api/conversations/${id}/actions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...extra }),
    });
    const json = await res.json();
    if (json.ok && json.data.message) {
      setMessages((prev) => [...prev, json.data.message]);
    }
    if (json.ok && json.data.sold) setCanMarkSold(false);
  }

  if (loading || !meId) return <LoadingSkeleton />;

  return (
    <div className="container-page grid gap-4 py-8 lg:grid-cols-[1fr_280px]">
      <div>
        {warning ? <SafetyWarning message={warning} className="mb-4" /> : null}
        <ChatWindow
          title={meta.title}
          subtitle={meta.subtitle}
          messages={messages.map((m) => ({
            id: m.id,
            body: m.body,
            sentAt: m.createdAt,
            fromMe: m.senderId === meId,
            senderName: m.sender?.displayName || m.sender?.name,
          }))}
          onSend={(body) => void send(body)}
        />
      </div>
      <aside className="space-y-4 rounded-2xl border border-border bg-white p-4">
        <h2 className="font-display text-lg font-semibold">Close the deal</h2>
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
            Quick replies
          </p>
          {canned.slice(0, 5).map((text) => (
            <button
              key={text}
              type="button"
              className="block w-full rounded-xl border border-border px-3 py-2 text-left text-xs hover:bg-secondary"
              onClick={() => void runAction("canned", { canned: text })}
            >
              {text}
            </button>
          ))}
        </div>
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
            Safe meetup
          </p>
          {meetupPlaces.slice(0, 3).map((place) => (
            <Button
              key={place}
              size="sm"
              variant="outline"
              className="w-full justify-start text-xs"
              onClick={() => void runAction("meetup", { place })}
            >
              Meet at {place}
            </Button>
          ))}
        </div>
        <Button
          size="sm"
          variant="soft"
          className="w-full"
          onClick={() => void runAction("reveal_phone")}
        >
          Reveal my phone
        </Button>
        {canMarkSold ? (
          <Button
            size="sm"
            variant="lime"
            className="w-full"
            onClick={() => void runAction("mark_sold")}
          >
            Mark listing sold
          </Button>
        ) : null}
      </aside>
    </div>
  );
}
