import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn, formatInr } from "@/lib/utils";

export type OfferStatus = "pending" | "accepted" | "declined" | "withdrawn" | "countered";

export interface OfferCardProps {
  id: string;
  listingTitle: string;
  amount: number;
  status: OfferStatus;
  createdAt: Date | string;
  counterAmount?: number;
  fromMe?: boolean;
  onAccept?: (id: string) => void;
  onDecline?: (id: string) => void;
  onCounter?: (id: string) => void;
  className?: string;
}

const STATUS_VARIANT: Record<
  OfferStatus,
  { label: string; variant: "secondary" | "fair" | "danger" | "warning" | "soft" }
> = {
  pending: { label: "Pending", variant: "warning" },
  accepted: { label: "Accepted", variant: "fair" },
  declined: { label: "Declined", variant: "danger" },
  withdrawn: { label: "Withdrawn", variant: "secondary" },
  countered: { label: "Countered", variant: "soft" },
};

export function OfferCard({
  id,
  listingTitle,
  amount,
  status,
  createdAt,
  counterAmount,
  fromMe = false,
  onAccept,
  onDecline,
  onCounter,
  className,
}: OfferCardProps) {
  const date = typeof createdAt === "string" ? new Date(createdAt) : createdAt;
  const statusMeta = STATUS_VARIANT[status];

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="space-y-4 p-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="font-display text-base font-semibold">{listingTitle}</p>
            <p className="mt-1 text-xs text-foreground-muted">
              {fromMe ? "Your offer" : "Incoming offer"} ·{" "}
              {formatDistanceToNow(date, { addSuffix: true })}
            </p>
          </div>
          <Badge variant={statusMeta.variant}>{statusMeta.label}</Badge>
        </div>

        <div className="flex flex-wrap items-end gap-4">
          <div>
            <p className="text-xs text-foreground-muted">Offer amount</p>
            <p className="font-display text-2xl font-bold">{formatInr(amount)}</p>
          </div>
          {typeof counterAmount === "number" ? (
            <div>
              <p className="text-xs text-foreground-muted">Counter</p>
              <p className="font-display text-lg font-semibold text-primary">
                {formatInr(counterAmount)}
              </p>
            </div>
          ) : null}
        </div>

        {status === "pending" && !fromMe ? (
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => onAccept?.(id)}>
              Accept
            </Button>
            <Button size="sm" variant="outline" onClick={() => onCounter?.(id)}>
              Counter
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onDecline?.(id)}>
              Decline
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
