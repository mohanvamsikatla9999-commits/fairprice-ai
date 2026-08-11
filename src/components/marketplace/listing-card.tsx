import Image from "next/image";
import Link from "next/link";
import { MapPin, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn, formatInr } from "@/lib/utils";

export type FairPriceLabel =
  | "UNDERPRICED"
  | "FAIR"
  | "SLIGHTLY_HIGH"
  | "OVERPRICED";

export interface ListingCardProps {
  id: string;
  title: string;
  price: number;
  imageUrl: string;
  condition: string;
  location: string;
  fairLabel?: FairPriceLabel;
  fairRange?: { low: number; high: number };
  trustScore?: number;
  featured?: boolean;
  href?: string;
  className?: string;
}

const labelVariant: Record<
  FairPriceLabel,
  { badge: "fair" | "warning" | "danger" | "soft"; text: string }
> = {
  UNDERPRICED: { badge: "fair", text: "Underpriced" },
  FAIR: { badge: "fair", text: "Fair price" },
  SLIGHTLY_HIGH: { badge: "warning", text: "Slightly high" },
  OVERPRICED: { badge: "danger", text: "Overpriced" },
};

export function ListingCard({
  id,
  title,
  price,
  imageUrl,
  condition,
  location,
  fairLabel,
  fairRange,
  trustScore,
  featured,
  href,
  className,
}: ListingCardProps) {
  const link = href ?? `/product/${id}`;
  const label = fairLabel ? labelVariant[fairLabel] : null;

  return (
    <Link
      href={link}
      className={cn(
        "group flex flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-lg",
        className,
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-background-muted">
        <Image
          src={imageUrl}
          alt={title}
          fill
          className="object-cover transition duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, 25vw"
        />
        {featured ? (
          <Badge variant="soft" className="absolute right-3 top-3 shadow-sm">
            Featured
          </Badge>
        ) : null}
        {label ? (
          <Badge variant={label.badge} className="absolute left-3 top-3 shadow-sm">
            {label.text}
          </Badge>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-2 font-display text-base font-semibold leading-snug text-foreground">
          {title}
        </h3>
        <div className="flex items-baseline gap-2">
          <span className="font-display text-xl font-bold text-foreground">
            {formatInr(price)}
          </span>
          {fairRange ? (
            <span className="text-xs text-foreground-muted">
              Fair {formatInr(fairRange.low, { compact: true })}–
              {formatInr(fairRange.high, { compact: true })}
            </span>
          ) : null}
        </div>
        <div className="mt-auto flex flex-wrap items-center gap-2 pt-1 text-xs text-foreground-muted">
          <Badge variant="secondary" className="font-medium">
            {condition}
          </Badge>
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            {location}
          </span>
          {typeof trustScore === "number" ? (
            <span className="inline-flex items-center gap-1 text-primary">
              <ShieldCheck className="h-3.5 w-3.5" />
              {trustScore}% trust
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
