"use client";

import * as React from "react";
import { Send } from "lucide-react";
import { MessageBubble } from "@/components/chat/message-bubble";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface ChatMessage {
  id: string;
  body: string;
  sentAt: Date | string;
  fromMe?: boolean;
  senderName?: string;
}

export interface ChatWindowProps {
  title: string;
  subtitle?: string;
  avatarUrl?: string;
  messages: ChatMessage[];
  onSend?: (body: string) => void;
  className?: string;
  emptyText?: string;
}

export function ChatWindow({
  title,
  subtitle,
  avatarUrl,
  messages,
  onSend,
  className,
  emptyText = "No messages yet. Say hello and make an offer.",
}: ChatWindowProps) {
  const [draft, setDraft] = React.useState("");
  const bottomRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const body = draft.trim();
    if (!body) return;
    onSend?.(body);
    setDraft("");
  }

  return (
    <div
      className={cn(
        "flex h-[min(70vh,640px)] flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-sm",
        className,
      )}
    >
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <Avatar>
          <AvatarImage src={avatarUrl} alt={title} />
          <AvatarFallback>
            {title
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate font-display font-semibold">{title}</p>
          {subtitle ? (
            <p className="truncate text-xs text-foreground-muted">{subtitle}</p>
          ) : null}
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto bg-background-muted/50 px-4 py-4">
        {messages.length === 0 ? (
          <p className="py-12 text-center text-sm text-foreground-muted">{emptyText}</p>
        ) : (
          messages.map((msg) => <MessageBubble key={msg.id} {...msg} />)
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="flex gap-2 border-t border-border p-3">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Type a message..."
          className="flex-1"
        />
        <Button type="submit" size="icon" aria-label="Send message" disabled={!draft.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
