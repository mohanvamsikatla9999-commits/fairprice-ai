import type { Metadata, Viewport } from "next";
import { DM_Sans, Outfit } from "next/font/google";
import { SiteShell } from "@/components/layout/site-shell";
import { PwaRegister } from "@/components/layout/pwa-register";
import { siteConfig } from "@/config/site";
import { env } from "@/config/env";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
});

function absoluteUrl() {
  try {
    return new URL(env.APP_URL || siteConfig.url);
  } catch {
    return new URL(siteConfig.url);
  }
}

export const metadata: Metadata = {
  metadataBase: absoluteUrl(),
  title: {
    default: "FairPrice AI — Know What It's Worth",
    template: "%s · FairPrice AI",
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  manifest: "/manifest.json",
  keywords: [
    "FairPrice AI",
    "used goods India",
    "AI valuation",
    "fair price marketplace",
    "resale",
  ],
  authors: [{ name: "FairPrice AI" }],
  creator: "FairPrice AI",
  openGraph: {
    type: "website",
    locale: siteConfig.locale,
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: "FairPrice AI — Know What It's Worth",
    description: siteConfig.description,
  },
  twitter: {
    card: "summary_large_image",
    title: "FairPrice AI — Know What It's Worth",
    description: siteConfig.description,
  },
  appleWebApp: {
    capable: true,
    title: siteConfig.shortName,
    statusBarStyle: "default",
  },
  icons: {
    icon: [{ url: "/placeholder-listing.svg", type: "image/svg+xml" }],
    apple: [{ url: "/placeholder-listing.svg", type: "image/svg+xml" }],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#1b4dff" },
    { media: "(prefers-color-scheme: dark)", color: "#1b4dff" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#1b4dff" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content={siteConfig.shortName} />
      </head>
      <body className={`${outfit.variable} ${dmSans.variable} antialiased`}>
        <PwaRegister />
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
