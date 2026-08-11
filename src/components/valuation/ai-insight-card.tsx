import { Lightbulb, Sparkles, TrendingDown, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type InsightTone = "neutral" | "positive" | "caution" | "tip";

export interface AiInsightCardProps {
  title: string;
  body: string;
  tone?: InsightTone;
  className?: string;
}

const TONE_STYLES: Record<
  InsightTone,
  { icon: typeof Sparkles; wrap: string; iconWrap: string }
> = {
  neutral: {
    icon: Sparkles,
    wrap: "border-primary/15 bg-gradient-to-br from-white to-primary/[0.04]",
    iconWrap: "bg-primary/10 text-primary",
  },
  positive: {
    icon: TrendingUp,
    wrap: "border-emerald-200 bg-emerald-50/60",
    iconWrap: "bg-emerald-100 text-emerald-700",
  },
  caution: {
    icon: TrendingDown,
    wrap: "border-amber-200 bg-amber-50/70",
    iconWrap: "bg-amber-100 text-amber-700",
  },
  tip: {
    icon: Lightbulb,
    wrap: "border-accent/40 bg-accent/15",
    iconWrap: "bg-accent text-accent-foreground",
  },
};

export function AiInsightCard({
  title,
  body,
  tone = "neutral",
  className,
}: AiInsightCardProps) {
  const style = TONE_STYLES[tone];
  const Icon = style.icon;

  return (
    <Card className={cn("border shadow-sm", style.wrap, className)}>
      <CardContent className="flex gap-3 p-4">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
            style.iconWrap,
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 space-y-1">
          <p className="font-display text-sm font-semibold text-foreground">{title}</p>
          <p className="text-sm leading-relaxed text-foreground-muted">{body}</p>
        </div>
      </CardContent>
    </Card>
  );
}
