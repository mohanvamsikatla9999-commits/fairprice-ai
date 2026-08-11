import { BadgeCheck, Shield, ShieldAlert, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type TrustLevel = "verified" | "trusted" | "new" | "caution";

export interface TrustBadgeProps {
  level: TrustLevel;
  score?: number;
  className?: string;
}

const CONFIG: Record<
  TrustLevel,
  {
    label: string;
    icon: typeof Shield;
    variant: "fair" | "soft" | "secondary" | "warning";
  }
> = {
  verified: { label: "Verified seller", icon: BadgeCheck, variant: "fair" },
  trusted: { label: "Trusted", icon: ShieldCheck, variant: "soft" },
  new: { label: "New seller", icon: Shield, variant: "secondary" },
  caution: { label: "Review carefully", icon: ShieldAlert, variant: "warning" },
};

export function TrustBadge({ level, score, className }: TrustBadgeProps) {
  const config = CONFIG[level];
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={cn("gap-1.5", className)}>
      <Icon className="h-3.5 w-3.5" />
      {config.label}
      {typeof score === "number" ? <span>· {score}%</span> : null}
    </Badge>
  );
}
