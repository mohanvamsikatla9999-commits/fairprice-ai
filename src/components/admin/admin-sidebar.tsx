"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Flag,
  LayoutDashboard,
  ListChecks,
  Settings,
  Shield,
  Users,
  AlertTriangle,
  Tags,
  LineChart,
  Receipt,
  Sparkles,
  BadgeCheck,
} from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/admin/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/listings", label: "Listings", icon: ListChecks },
  { href: "/admin/moderation", label: "Moderation", icon: Shield },
  { href: "/admin/reports", label: "Reports", icon: Flag },
  { href: "/admin/fraud", label: "Fraud", icon: AlertTriangle },
  { href: "/admin/verification", label: "Verification", icon: BadgeCheck },
  { href: "/admin/valuations", label: "Valuations", icon: Sparkles },
  { href: "/admin/categories", label: "Categories", icon: Tags },
  { href: "/admin/market-data", label: "Market data", icon: LineChart },
  { href: "/admin/transactions", label: "Transactions", icon: Receipt },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export interface AdminSidebarProps {
  className?: string;
}

export function AdminSidebar({ className }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "flex h-full w-64 flex-col border-r border-border bg-white",
        className,
      )}
    >
      <div className="border-b border-border px-5 py-5">
        <Logo size="sm" href="/admin/dashboard" />
        <p className="mt-2 text-xs font-medium uppercase tracking-wider text-foreground-muted">
          Admin console
        </p>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {LINKS.map((link) => {
          const active =
            pathname === link.href || pathname.startsWith(`${link.href}/`);
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-foreground-muted hover:bg-secondary hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
