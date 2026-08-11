"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn, formatInr } from "@/lib/utils";

export type PriceMeterZone =
  | "UNDERPRICED"
  | "FAIR"
  | "SLIGHTLY_HIGH"
  | "OVERPRICED";

export interface PriceMeterProps {
  sellerPrice: number;
  fairLow: number;
  fairHigh: number;
  negotiationLow?: number;
  negotiationHigh?: number;
  zone?: PriceMeterZone;
  className?: string;
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function resolveZone(
  sellerPrice: number,
  fairLow: number,
  fairHigh: number,
): PriceMeterZone {
  if (sellerPrice < fairLow * 0.92) return "UNDERPRICED";
  if (sellerPrice <= fairHigh) return "FAIR";
  if (sellerPrice <= fairHigh * 1.12) return "SLIGHTLY_HIGH";
  return "OVERPRICED";
}

const ZONE_COPY: Record<PriceMeterZone, { label: string; tone: string }> = {
  UNDERPRICED: { label: "Underpriced", tone: "text-emerald-700" },
  FAIR: { label: "Fairly priced", tone: "text-primary" },
  SLIGHTLY_HIGH: { label: "Slightly high", tone: "text-amber-700" },
  OVERPRICED: { label: "Potentially overpriced", tone: "text-red-600" },
};

export function PriceMeter({
  sellerPrice,
  fairLow,
  fairHigh,
  negotiationLow,
  negotiationHigh,
  zone,
  className,
}: PriceMeterProps) {
  const reduceMotion = useReducedMotion();
  const resolved = zone ?? resolveZone(sellerPrice, fairLow, fairHigh);
  const copy = ZONE_COPY[resolved];

  const spanPad = Math.max((fairHigh - fairLow) * 1.8, fairHigh * 0.25, 5000);
  const min = Math.min(sellerPrice, fairLow, negotiationLow ?? fairLow) - spanPad * 0.15;
  const max = Math.max(sellerPrice, fairHigh, negotiationHigh ?? fairHigh) + spanPad * 0.15;
  const range = max - min || 1;

  const toPct = (v: number) => clamp(((v - min) / range) * 100, 0, 100);
  const fairStart = toPct(fairLow);
  const fairEnd = toPct(fairHigh);
  const marker = toPct(sellerPrice);
  const negoStart = toPct(negotiationLow ?? fairLow * 0.95);
  const negoEnd = toPct(negotiationHigh ?? fairHigh * 1.05);

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-foreground-muted">
            Price position
          </p>
          <p className={cn("font-display text-2xl font-bold", copy.tone)}>{copy.label}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-foreground-muted">Seller asking</p>
          <p className="font-display text-xl font-bold">{formatInr(sellerPrice)}</p>
        </div>
      </div>

      <div className="relative pt-8 pb-6">
        <div className="price-meter h-4 w-full rounded-full shadow-inner" />

        <div
          className="absolute top-8 h-4 rounded-full bg-white/35 ring-1 ring-white/50"
          style={{ left: `${fairStart}%`, width: `${Math.max(fairEnd - fairStart, 2)}%` }}
          title="Fair value range"
        />

        <div
          className="absolute top-[2.15rem] h-1.5 rounded-full bg-primary/40"
          style={{ left: `${negoStart}%`, width: `${Math.max(negoEnd - negoStart, 2)}%` }}
          title="Negotiation zone"
        />

        <motion.div
          className="absolute top-2 flex -translate-x-1/2 flex-col items-center"
          initial={reduceMotion ? false : { left: "0%", opacity: 0 }}
          animate={{ left: `${marker}%`, opacity: 1 }}
          transition={
            reduceMotion
              ? { duration: 0 }
              : { type: "spring", stiffness: 120, damping: 18, delay: 0.15 }
          }
        >
          <div className="rounded-lg bg-foreground px-2 py-1 text-[11px] font-semibold text-white shadow-lg">
            {formatInr(sellerPrice, { compact: true })}
          </div>
          <div className="mt-1 h-3 w-0.5 bg-foreground" />
          <div className="h-3.5 w-3.5 rounded-full border-2 border-white bg-foreground shadow-md" />
        </motion.div>

        <div
          className="absolute bottom-0 -translate-x-1/2 text-[10px] font-medium text-emerald-700"
          style={{ left: `${(fairStart + fairEnd) / 2}%` }}
        >
          Fair range
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        <div className="rounded-xl bg-emerald-50 px-2 py-2 text-emerald-800">
          <p className="font-medium">Underpriced</p>
        </div>
        <div className="rounded-xl bg-primary/10 px-2 py-2 text-primary">
          <p className="font-medium">Fair</p>
        </div>
        <div className="rounded-xl bg-red-50 px-2 py-2 text-red-700">
          <p className="font-medium">Overpriced</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-background-muted px-3 py-2.5 text-xs text-foreground-muted">
        <span>
          Fair band: {formatInr(fairLow)} – {formatInr(fairHigh)}
        </span>
        <span>
          Negotiate around: {formatInr(negotiationLow ?? Math.round(fairLow * 0.97))} –{" "}
          {formatInr(negotiationHigh ?? Math.round(fairHigh * 1.03))}
        </span>
      </div>
    </div>
  );
}
