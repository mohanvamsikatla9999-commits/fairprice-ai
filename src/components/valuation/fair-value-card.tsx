import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { DemandIndicator, type DemandLevel } from "@/components/valuation/demand-indicator";
import { cn, formatInr } from "@/lib/utils";

export interface FairValueCardProps {
  fairLow: number;
  fairHigh: number;
  recommendedListing: number;
  expectedSelling: number;
  quickSale: number;
  confidence: number;
  demand: DemandLevel;
  title?: string;
  className?: string;
}

export function FairValueCard({
  fairLow,
  fairHigh,
  recommendedListing,
  expectedSelling,
  quickSale,
  confidence,
  demand,
  title = "Fair Value Summary",
  className,
}: FairValueCardProps) {
  return (
    <Card className={cn("overflow-hidden border-primary/15 shadow-md", className)}>
      <CardHeader className="border-b border-border bg-gradient-to-br from-primary/5 to-accent/10 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <Badge variant="soft" className="mb-2">
              AI valuation
            </Badge>
            <CardTitle>{title}</CardTitle>
          </div>
          <DemandIndicator level={demand} />
        </div>
      </CardHeader>
      <CardContent className="space-y-5 pt-5">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-foreground-muted">
            Fair value range
          </p>
          <p className="mt-1 font-display text-3xl font-bold tracking-tight text-foreground">
            {formatInr(fairLow)} – {formatInr(fairHigh)}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Metric label="Recommended listing" value={recommendedListing} highlight />
          <Metric label="Expected selling" value={expectedSelling} />
          <Metric label="Quick sale" value={quickSale} subtle />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium">Confidence</span>
            <span className="text-foreground-muted">{Math.round(confidence)}%</span>
          </div>
          <Progress value={confidence} className="h-2.5" />
        </div>
      </CardContent>
    </Card>
  );
}

function Metric({
  label,
  value,
  highlight,
  subtle,
}: {
  label: string;
  value: number;
  highlight?: boolean;
  subtle?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border px-3 py-3",
        highlight
          ? "border-accent/60 bg-accent/20"
          : subtle
            ? "border-border bg-background-muted"
            : "border-border bg-white",
      )}
    >
      <p className="text-xs text-foreground-muted">{label}</p>
      <p className="mt-1 font-display text-lg font-bold">{formatInr(value)}</p>
    </div>
  );
}
