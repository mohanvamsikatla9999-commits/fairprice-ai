import Image from "next/image";
import Link from "next/link";
import { MapPin, ShieldCheck, Zap } from "lucide-react";
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

const LABEL_CONFIG: Record<FairPriceLabel, { color: string; text: string; bg: string }> = {
  UNDERPRICED: { color: "text-green-700", bg: "bg-green-100", text: "Underpriced 🔥" },
  FAIR:        { color: "text-primary",   bg: "bg-primary/10", text: "Fair price ✓" },
  SLIGHTLY_HIGH: { color: "text-amber-700", bg: "bg-amber-100", text: "Slightly high" },
  OVERPRICED:  { color: "text-red-600",   bg: "bg-red-100",    text: "Overpriced" },
};

const CONDITION_COLOR: Record<string, string> = {
  "LIKE NEW": "bg-green-100 text-green-700",
  "EXCELLENT": "bg-emerald-100 text-emerald-700",
  "GOOD": "bg-blue-100 text-blue-700",
  "FAIR": "bg-amber-100 text-amber-700",
  "POOR": "bg-red-100 text-red-600",
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
  const label = fairLabel ? LABEL_CONFIG[fairLabel] : null;
  const conditionKey = condition.toUpperCase();
  const conditionColor = CONDITION_COLOR[conditionKey] ?? "bg-gray-100 text-gray-600";

  return (
    <Link
      href={link}
      className={cn(
        "group flex flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl",
        featured && "ring-2 ring-accent ring-offset-1",
        className,
      )}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-background-muted">
        <Image
          src={imageUrl}
          alt={title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

        {/* Badges */}
        <div className="absolute left-2.5 top-2.5 flex flex-col gap-1.5">
          {featured && (
            <span className="flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-[11px] font-bold text-accent-foreground shadow-sm">
              <Zap className="h-3 w-3" />
              Featured
            </span>
          )}
          {label && (
            <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-semibold shadow-sm", label.bg, label.color)}>
              {label.text}
            </span>
          )}
        </div>

        {/* Condition badge top-right */}
        <span className={cn("absolute right-2.5 top-2.5 rounded-full px-2 py-0.5 text-[10px] font-semibold", conditionColor)}>
          {condition}
        </span>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-2 font-display text-sm font-semibold leading-snug text-foreground sm:text-base">
          {title}
        </h3>

        {/* Price row */}
        <div className="flex items-baseline justify-between gap-2">
          <span className="font-display text-lg font-bold text-foreground sm:text-xl">
            {formatInr(price)}
          </span>
          {fairRange && (
            <span className="shrink-0 text-xs text-foreground-muted">
              Fair {formatInr(fairRange.low, { compact: true })}–{formatInr(fairRange.high, { compact: true })}
            </span>
          )}
        </div>

        {/* Footer row */}
        <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-border/60 pt-2.5 text-xs text-foreground-muted">
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="line-clamp-1">{location}</span>
          </span>
          {typeof trustScore === "number" && trustScore >= 60 && (
            <span className="inline-flex items-center gap-1 text-primary">
              <ShieldCheck className="h-3 w-3" />
              {trustScore}%
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
