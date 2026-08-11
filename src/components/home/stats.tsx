"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";

const HIGHLIGHTS = [
  { value: "Evidence", label: "Valuations from market comps, not guesses" },
  { value: "Local", label: "Buy and sell in your city" },
  { value: "Transparent", label: "Fair range + confidence on every estimate" },
  { value: "Yours", label: "Only real user listings appear here" },
];

export function Stats() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="container-page py-16">
      <div className="grid grid-cols-2 gap-4 rounded-3xl border border-primary/15 bg-gradient-to-br from-primary to-primary-bright p-6 text-white shadow-xl shadow-primary/20 sm:grid-cols-4 sm:p-8">
        {HIGHLIGHTS.map((stat, index) => (
          <motion.div
            key={stat.label}
            className="text-center sm:text-left"
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ delay: index * 0.08, duration: 0.45 }}
          >
            <p className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
              {stat.value}
            </p>
            <p className="mt-1 text-sm text-white/80">{stat.label}</p>
          </motion.div>
        ))}
      </div>
      <p className="mt-4 text-center text-sm text-foreground-muted">
        Ready to add inventory?{" "}
        <Link href="/sell" className="font-medium text-primary hover:underline">
          Create a listing
        </Link>
      </p>
    </section>
  );
}
