import { format } from "date-fns";
import { cn } from "@/lib/utils";

export interface MessageBubbleProps {
  body: string;
  sentAt: Date | string;
  fromMe?: boolean;
  senderName?: string;
  className?: string;
}

export function MessageBubble({
  body,
  sentAt,
  fromMe = false,
  senderName,
  className,
}: MessageBubbleProps) {
  const date = typeof sentAt === "string" ? new Date(sentAt) : sentAt;

  return (
    <div
      className={cn(
        "flex w-full",
        fromMe ? "justify-end" : "justify-start",
        className,
      )}
    >
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-2.5 shadow-sm",
          fromMe
            ? "rounded-br-md bg-primary text-primary-foreground"
            : "rounded-bl-md border border-border bg-white text-foreground",
        )}
      >
        {!fromMe && senderName ? (
          <p className="mb-1 text-xs font-semibold text-primary">{senderName}</p>
        ) : null}
        <p className="whitespace-pre-wrap text-sm leading-relaxed">{body}</p>
        <p
          className={cn(
            "mt-1 text-[10px]",
            fromMe ? "text-white/70" : "text-foreground-muted",
          )}
        >
          {format(date, "hh:mm a")}
        </p>
      </div>
    </div>
  );
}
