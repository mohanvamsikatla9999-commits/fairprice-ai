"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { SearchBar } from "@/components/marketplace/search-bar";
import { Button } from "@/components/ui/button";
import { CheckFairPriceButton } from "@/components/valuation/check-fairprice-button";

export function Hero() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative overflow-hidden">
      <div className="hero-blue relative">
        <div className="pointer-events-none absolute inset-0 opacity-30">
          <div className="absolute -left-20 top-10 h-64 w-64 rounded-full bg-accent/30 blur-3xl" />
          <div className="absolute bottom-0 right-10 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        </div>

        <div className="container-page relative grid items-center gap-10 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:py-24">
          <div className="max-w-xl text-white">
            <p className="mb-4 font-display text-sm font-semibold uppercase tracking-[0.18em] text-accent">
              FairPrice AI
            </p>
            <h1 className="font-display text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
              Know What It&apos;s Worth.
            </h1>
            <p className="mt-5 max-w-md text-lg text-white/85">
              Buy and sell used goods with clear AI valuations — so every deal feels fair.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <CheckFairPriceButton href="/value" label="Find a Fair Price" />
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/40 bg-white/10 text-white hover:bg-white hover:text-primary"
              >
                <Link href="/sell">Sell Something</Link>
              </Button>
            </div>
            <div className="mt-8 max-w-lg">
              <SearchBar
                size="lg"
                className="border-0 bg-white shadow-2xl"
                onSearch={(q) => {
                  window.location.href = `/marketplace?q=${encodeURIComponent(q)}`;
                }}
              />
            </div>
          </div>

          <motion.div
            className="relative mx-auto w-full max-w-md"
            initial={reduceMotion ? false : { opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
          >
            <div className="glass-card relative z-10 space-y-4 p-5 sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                Real listings only
              </p>
              <h3 className="font-display text-xl font-bold text-foreground">
                Marketplace stays empty until someone sells
              </h3>
              <p className="text-sm leading-relaxed text-foreground-muted">
                No demo inventory. Browse what real users list, or post your first item in
                minutes.
              </p>
              <div className="flex flex-wrap gap-3 pt-1">
                <Button asChild>
                  <Link href="/sell">List an item</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/marketplace">Browse marketplace</Link>
                </Button>
              </div>
            </div>
            <div className="absolute -bottom-6 -left-4 -z-0 h-40 w-40 rounded-full bg-accent/40 blur-2xl" />
            <div className="absolute -right-6 -top-6 -z-0 h-36 w-36 rounded-full bg-white/20 blur-2xl" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
