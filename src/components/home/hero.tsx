"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Sparkles, ShieldCheck, TrendingUp, Tag } from "lucide-react";
import { SearchBar } from "@/components/marketplace/search-bar";
import { Button } from "@/components/ui/button";

const TRUST_BADGES = [
  { icon: ShieldCheck, label: "Fraud detection" },
  { icon: TrendingUp, label: "Live market prices" },
  { icon: Sparkles, label: "AI-powered" },
];

export function Hero() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative overflow-hidden">
      <div className="hero-blue relative">
        {/* Background blobs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />
          <div className="absolute bottom-0 right-10 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary-bright/20 blur-3xl" />
        </div>

        <div className="container-page relative grid items-center gap-12 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:py-28">
          {/* Left — copy */}
          <motion.div
            className="max-w-xl text-white"
            initial={reduceMotion ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-accent">
              <Sparkles className="h-3.5 w-3.5" />
              FairPrice AI — India&apos;s smarter marketplace
            </div>

            <h1 className="font-display text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
              Know What It&apos;s{" "}
              <span className="relative whitespace-nowrap">
                <span className="relative z-10 text-accent">Worth.</span>
                <svg
                  className="absolute -bottom-2 left-0 h-3 w-full text-accent/40"
                  viewBox="0 0 200 8"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <path d="M0 7 Q100 0 200 7" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                </svg>
              </span>
            </h1>

            <p className="mt-5 max-w-md text-lg leading-relaxed text-white/85">
              Buy and sell used goods with real AI valuations — original price, depreciation, fair second-hand range. Every deal feels fair.
            </p>

            {/* Search bar */}
            <div className="mt-7 max-w-lg">
              <SearchBar
                size="lg"
                className="border-0 bg-white shadow-2xl"
                onSearch={(q) => {
                  window.location.href = `/marketplace?q=${encodeURIComponent(q)}`;
                }}
              />
            </div>

            {/* CTA buttons */}
            <div className="mt-5 flex flex-wrap gap-3">
              <Button asChild size="lg" variant="lime">
                <Link href="/sell">
                  <Tag className="h-4 w-4" />
                  Sell with AI
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/40 bg-white/10 text-white hover:bg-white hover:text-primary"
              >
                <Link href="/marketplace">Browse listings</Link>
              </Button>
            </div>

            {/* Trust badges */}
            <div className="mt-8 flex flex-wrap gap-3">
              {TRUST_BADGES.map((badge) => (
                <div
                  key={badge.label}
                  className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-white/90"
                >
                  <badge.icon className="h-3.5 w-3.5 text-accent" />
                  {badge.label}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right — feature card */}
          <motion.div
            className="relative mx-auto w-full max-w-sm"
            initial={reduceMotion ? false : { opacity: 0, y: 32, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.18 }}
          >
            {/* FairPrice sample card */}
            <div className="glass-card relative z-10 overflow-hidden p-6">
              {/* Header */}
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                    FairPrice AI
                  </p>
                  <h3 className="mt-0.5 font-display text-lg font-bold">POCO M7 6GB/128GB</h3>
                </div>
                <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">
                  Fair price
                </span>
              </div>

              {/* Price range */}
              <div className="rounded-xl bg-primary/5 p-4">
                <p className="text-xs text-foreground-muted">Fair second-hand range</p>
                <p className="mt-1 font-display text-2xl font-bold text-foreground">
                  ₹7,500 – ₹9,200
                </p>
                <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                  {[
                    { label: "Original MRP", value: "₹12,499" },
                    { label: "Recommended", value: "₹8,800" },
                    { label: "Quick sale", value: "₹7,200" },
                  ].map((s) => (
                    <div key={s.label} className="rounded-lg bg-white p-2 shadow-sm">
                      <p className="text-[10px] text-foreground-muted">{s.label}</p>
                      <p className="text-xs font-bold">{s.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Explanation */}
              <p className="mt-3 text-xs leading-relaxed text-foreground-muted">
                Original price ₹12,499. After 8 months &amp; good condition, depreciation ~40%. Fair resale: ₹7,500–₹9,200.
              </p>

              <div className="mt-4 flex gap-2">
                <Button size="sm" className="flex-1" asChild>
                  <Link href="/sell">Sell this</Link>
                </Button>
                <Button size="sm" variant="outline" className="flex-1" asChild>
                  <Link href="/value">Check mine</Link>
                </Button>
              </div>
            </div>

            {/* Floating decorations */}
            <div className="absolute -bottom-8 -left-6 -z-0 h-44 w-44 rounded-full bg-accent/30 blur-3xl" />
            <div className="absolute -right-8 -top-8 -z-0 h-40 w-40 rounded-full bg-white/20 blur-3xl" />
          </motion.div>
        </div>
      </div>

      {/* Wave separator */}
      <div className="relative -mt-1 bg-background">
        <svg
          className="w-full text-[#1b4dff]"
          style={{ height: "48px" }}
          viewBox="0 0 1440 48"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="M0 48 L0 24 Q360 0 720 24 Q1080 48 1440 24 L1440 48 Z"
            fill="currentColor"
          />
        </svg>
      </div>
    </section>
  );
}
