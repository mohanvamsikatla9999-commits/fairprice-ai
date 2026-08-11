"use client";

import { BadgeCheck, ScanFace, ShieldCheck, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";

export type VerificationBadgeKind =
  | "identity"
  | "face"
  | "phone"
  | "email"
  | "trusted";

const CONFIG: Record<
  VerificationBadgeKind,
  { label: string; icon: typeof BadgeCheck; className: string }
> = {
  identity: {
    label: "Identity verified",
    icon: BadgeCheck,
    className: "bg-emerald-50 text-emerald-800 border-emerald-200",
  },
  face: {
    label: "Face + liveness verified",
    icon: ScanFace,
    className: "bg-sky-50 text-sky-800 border-sky-200",
  },
  phone: {
    label: "Phone verified",
    icon: Smartphone,
    className: "bg-slate-50 text-slate-700 border-slate-200",
  },
  email: {
    label: "Email verified",
    icon: ShieldCheck,
    className: "bg-slate-50 text-slate-700 border-slate-200",
  },
  trusted: {
    label: "Trusted seller",
    icon: ShieldCheck,
    className: "bg-amber-50 text-amber-900 border-amber-200",
  },
};

const TOOLTIP =
  "Verification confirms that this account completed FairPrice's identity verification process. It does not guarantee the product or transaction.";

export function VerificationBadge({
  kind,
  className,
}: {
  kind: VerificationBadgeKind;
  className?: string;
}) {
  const config = CONFIG[kind];
  const Icon = config.icon;
  return (
    <span
      title={TOOLTIP}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        config.className,
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {config.label}
    </span>
  );
}
