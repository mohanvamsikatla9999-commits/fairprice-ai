import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SafetyWarningProps {
  title?: string;
  message: string;
  className?: string;
  severity?: "info" | "warning" | "critical";
}

const SEVERITY = {
  info: "border-primary/25 bg-primary/5 text-foreground",
  warning: "border-amber-300 bg-amber-50 text-amber-950",
  critical: "border-red-300 bg-red-50 text-red-950",
};

export function SafetyWarning({
  title = "Stay safe",
  message,
  className,
  severity = "warning",
}: SafetyWarningProps) {
  return (
    <div
      role="note"
      className={cn(
        "flex gap-3 rounded-2xl border px-4 py-3.5",
        SEVERITY[severity],
        className,
      )}
    >
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
      <div className="space-y-1">
        <p className="font-display text-sm font-semibold">{title}</p>
        <p className="text-sm leading-relaxed opacity-90">{message}</p>
      </div>
    </div>
  );
}
