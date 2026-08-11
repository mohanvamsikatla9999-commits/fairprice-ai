"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MessageSquare, PlusCircle, Search, User } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/marketplace", label: "Search", icon: Search },
  { href: "/sell", label: "Sell", icon: PlusCircle, emphasize: true },
  { href: "/messages", label: "Messages", icon: MessageSquare },
  { href: "/my-listings", label: "Account", icon: User },
] as const;

export interface BottomNavProps {
  className?: string;
}

export function BottomNav({ className }: BottomNavProps) {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t border-border bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden",
        className,
      )}
      aria-label="Mobile navigation"
    >
      <ul className="grid h-16 grid-cols-5">
        {ITEMS.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex h-full flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors",
                  active ? "text-primary" : "text-foreground-muted",
                  "emphasize" in item && item.emphasize && !active
                    ? "text-foreground"
                    : null,
                )}
              >
                <span
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full",
                    "emphasize" in item && item.emphasize
                      ? "bg-accent text-accent-foreground shadow-sm"
                      : active
                        ? "bg-primary/10"
                        : null,
                  )}
                >
                  <Icon className="h-5 w-5" />
                </span>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
