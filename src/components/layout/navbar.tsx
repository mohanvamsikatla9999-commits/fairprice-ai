"use client";

import * as React from "react";
import Link from "next/link";
import { Bell, Menu, MessageSquare, Search, Tag, X } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { CityPicker, loadSavedCity } from "@/components/marketplace/city-picker";
import type { IndiaCity } from "@/config/india-cities";
import { LanguageToggle } from "@/components/layout/language-toggle";

const CATEGORIES = [
  { label: "Mobiles", href: "/category/mobiles" },
  { label: "Laptops", href: "/category/laptops" },
  { label: "Cars", href: "/category/cars" },
  { label: "Furniture", href: "/category/furniture" },
  { label: "Fashion", href: "/category/fashion" },
  { label: "Appliances", href: "/category/appliances" },
];

export interface NavbarProps {
  className?: string;
  user?: {
    name: string;
    email?: string;
    image?: string;
  } | null;
  unreadMessages?: number;
  unreadNotifications?: number;
}

export function Navbar({
  className,
  user = null,
  unreadMessages = 0,
  unreadNotifications = 0,
}: NavbarProps) {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [city, setCity] = React.useState<IndiaCity | null>(null);

  React.useEffect(() => {
    setCity(loadSavedCity());
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b border-border/70 bg-white/85 backdrop-blur-xl",
        className,
      )}
    >
      <div className="container-page flex h-16 items-center gap-3 lg:h-[4.25rem]">
        <Logo size="md" />
        <CityPicker value={city} onChange={setCity} compact className="hidden sm:block" />
        <LanguageToggle className="hidden sm:inline-flex" />

        <form
          className="relative mx-2 hidden min-w-0 flex-1 md:block lg:mx-6"
          action="/marketplace"
          onSubmit={(e) => {
            if (!query.trim()) e.preventDefault();
          }}
        >
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-muted" />
          <Input
            name="q"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="What are you looking for?"
            className="h-11 rounded-full border-border/80 bg-background-muted pl-10 pr-4"
          />
        </form>

        <nav className="ml-auto hidden items-center gap-1 lg:flex">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                Categories
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {CATEGORIES.map((cat) => (
                <DropdownMenuItem key={cat.href} asChild>
                  <Link href={cat.href}>{cat.label}</Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="lime" size="sm" asChild>
            <Link href="/sell">
              <Tag className="h-4 w-4" />
              Sell
            </Link>
          </Button>

          <Button variant="ghost" size="icon" asChild className="relative">
            <Link href="/messages" aria-label="Messages">
              <MessageSquare className="h-5 w-5" />
              {unreadMessages > 0 ? (
                <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">
                  {unreadMessages > 9 ? "9+" : unreadMessages}
                </span>
              ) : null}
            </Link>
          </Button>

          <Button variant="ghost" size="icon" asChild className="relative">
            <Link href="/notifications" aria-label="Notifications">
              <Bell className="h-5 w-5" />
              {unreadNotifications > 0 ? (
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-accent ring-2 ring-white" />
              ) : null}
            </Link>
          </Button>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="ml-1 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user.image} alt={user.name} />
                    <AvatarFallback>
                      {user.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span>{user.name}</span>
                    {user.email ? (
                      <span className="text-xs font-normal text-foreground-muted">
                        {user.email}
                      </span>
                    ) : null}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/verify">FairPrice ID</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard">Seller dashboard</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/listings">My listings</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/verification">Verification</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/buyer">Buyer hub</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/alerts">Saved search alerts</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings">Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings/verification">Verification settings</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={async () => {
                    await fetch("/api/auth/logout", { method: "POST" });
                    window.location.href = "/";
                  }}
                >
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="outline" size="sm" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
          )}
        </nav>

        <Button
          variant="ghost"
          size="icon"
          className="ml-auto lg:hidden"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {mobileOpen ? (
        <div className="border-t border-border bg-white px-4 py-4 lg:hidden">
          <form action="/marketplace" className="mb-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-muted" />
              <Input
                name="q"
                placeholder="What are you looking for?"
                className="rounded-full bg-background-muted pl-10"
              />
            </div>
          </form>
          <div className="flex flex-col gap-1">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.href}
                href={cat.href}
                className="rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-secondary"
                onClick={() => setMobileOpen(false)}
              >
                {cat.label}
              </Link>
            ))}
            <Button variant="lime" className="mt-2" asChild>
              <Link href="/sell" onClick={() => setMobileOpen(false)}>
                Sell something
              </Link>
            </Button>
          </div>
        </div>
      ) : null}
    </header>
  );
}
