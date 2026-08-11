import { type LucideIcon, TrendingDown, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface DashboardCardProps {
  title: string;
  value: string;
  description?: string;
  icon?: LucideIcon;
  trend?: { value: string; direction: "up" | "down" };
  className?: string;
}

export function DashboardCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  className,
}: DashboardCardProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-foreground-muted">{title}</p>
            <p className="mt-2 font-display text-3xl font-bold tracking-tight">{value}</p>
          </div>
          {Icon ? (
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Icon className="h-5 w-5" />
            </div>
          ) : null}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          {trend ? (
            <span
              className={cn(
                "inline-flex items-center gap-1 font-semibold",
                trend.direction === "up" ? "text-emerald-600" : "text-red-600",
              )}
            >
              {trend.direction === "up" ? (
                <TrendingUp className="h-3.5 w-3.5" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5" />
              )}
              {trend.value}
            </span>
          ) : null}
          {description ? (
            <span className="text-foreground-muted">{description}</span>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
