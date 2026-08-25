"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Sparkles, ShieldCheck, MapPin, TrendingUp } from "lucide-react";

const STATS = [
  {
    icon: TrendingUp,
    value: "₹0 fees",
    label: "Free to list",
    sub: "No hidden charges ever",
  },
  {
    icon: Sparkles,
    value: "AI-powered",
    label: "Smart valuations",
    sub: "Original price → fair second-hand range",
  },
  {
    icon: MapPin,
    value: "50+ cities",
    label: "Across India",
    sub: "Hyderabad, Bengaluru, Mumbai & more",
  },
  {
    icon: ShieldCheck,
    value: "Fraud alerts",
    label: "Real-time detection",
    sub: "Verified sellers, safe transactions",
  },
];

export function Stats() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="container-page py-14">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {STATS.map((stat, index) => (
          <motion.div
            key={stat.label}
            className="flex flex-col gap-3 rounded-2xl border border-primary/10 bg-white p-5 shadow-sm"
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ delay: index * 0.08, duration: 0.45 }}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <stat.icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-display text-xl font-bold text-foreground sm:text-2xl">
                {stat.value}
              </p>
              <p className="mt-0.5 text-sm font-semibold text-foreground">{stat.label}</p>
              <p className="mt-1 text-xs text-foreground-muted">{stat.sub}</p>
            </div>
          </motion.div>
        ))}
      </div>
      <p className="mt-4 text-center text-sm text-foreground-muted">
        Ready to start?{" "}
        <Link href="/sell" className="font-semibold text-primary hover:underline">
          List your first item free →
        </Link>
      </p>
    </section>
  );
}
