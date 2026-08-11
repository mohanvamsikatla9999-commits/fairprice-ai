import { cn } from "@/lib/utils";

export type DemandLevel = "low" | "moderate" | "high" | "very_high";

export interface DemandIndicatorProps {
  level: DemandLevel;
  className?: string;
  showLabel?: boolean;
}

const CONFIG: Record<
  DemandLevel,
  { label: string; bars: number; color: string }
> = {
  low: { label: "Low demand", bars: 1, color: "bg-foreground-muted" },
  moderate: { label: "Moderate demand", bars: 2, color: "bg-amber-500" },
  high: { label: "High demand", bars: 3, color: "bg-primary" },
  very_high: { label: "Very high demand", bars: 4, color: "bg-emerald-500" },
};

export function DemandIndicator({
  level,
  className,
  showLabel = true,
}: DemandIndicatorProps) {
  const config = CONFIG[level];

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-border bg-white px-2.5 py-1.5 text-xs font-medium text-foreground",
        className,
      )}
    >
      <span className="flex items-end gap-0.5" aria-hidden="true">
        {[1, 2, 3, 4].map((bar) => (
          <span
            key={bar}
            className={cn(
              "w-1 rounded-sm",
              bar <= config.bars ? config.color : "bg-border",
              bar === 1 && "h-1.5",
              bar === 2 && "h-2.5",
              bar === 3 && "h-3.5",
              bar === 4 && "h-[18px]",
            )}
          />
        ))}
      </span>
      {showLabel ? <span>{config.label}</span> : null}
      <span className="sr-only">Demand level: {config.label}</span>
    </div>
  );
}
