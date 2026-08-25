import Link from "next/link";
import { Logo } from "@/components/layout/logo";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const FOOTER_COLUMNS = [
  {
    title: "Marketplace",
    links: [
      { label: "Browse listings", href: "/marketplace" },
      { label: "Sell an item", href: "/sell" },
      { label: "FairPrice check", href: "/value" },
      { label: "AI search", href: "/search" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "How it works", href: "/how-it-works" },
      { label: "Trust & safety", href: "/trust" },
      { label: "Careers", href: "/careers" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Help center", href: "/help" },
      { label: "Contact", href: "/contact" },
      { label: "Safety guidelines", href: "/safety-guidelines" },
      { label: "Developers", href: "/developers" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms of use", href: "/terms" },
      { label: "Privacy policy", href: "/privacy" },
      { label: "Cookie policy", href: "/cookies" },
      { label: "Community guidelines", href: "/community-guidelines" },
    ],
  },
];

export interface FooterProps {
  className?: string;
}

export function Footer({ className }: FooterProps) {
  return (
    <footer className={cn("border-t-2 border-t-primary/20 bg-white", className)}>
      <div className="container-page py-14">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_repeat(4,1fr)]">
          <div className="max-w-sm space-y-4">
            <Logo size="md" />
            <p className="text-sm leading-relaxed text-foreground-muted">
              Know what it&apos;s worth before you buy or sell. FairPrice AI brings
              transparent valuations to India&apos;s second-hand marketplace.
            </p>
            <p className="font-display text-sm font-semibold text-primary">
              Fair deals. Clear prices. Safer trades.
            </p>
          </div>

          {FOOTER_COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="mb-3 text-sm font-semibold text-foreground">{col.title}</h3>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-foreground-muted transition-colors hover:text-primary"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-foreground-muted">
            © {new Date().getFullYear()} FairPrice AI. All rights reserved.
          </p>
          <p className="text-xs text-foreground-muted">
            Valuations are estimates based on market data — not financial advice.
          </p>
        </div>
      </div>
    </footer>
  );
}
