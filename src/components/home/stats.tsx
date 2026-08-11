"use client";

import { motion, useReducedMotion } from "framer-motion";

const STATS = [
  { value: "2.4L+", label: "Valuations generated" },
  { value: "98%", label: "Users who felt more confident" },
  { value: "₹18K", label: "Avg. avoided overpay" },
  { value: "40+", label: "Cities with active listings" },
];

export function Stats() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="container-page py-16">
      <div className="grid grid-cols-2 gap-4 rounded-3xl border border-primary/15 bg-gradient-to-br from-primary to-primary-bright p-6 text-white shadow-xl shadow-primary/20 sm:grid-cols-4 sm:p-8">
        {STATS.map((stat, index) => (
          <motion.div
            key={stat.label}
            className="text-center sm:text-left"
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ delay: index * 0.08, duration: 0.45 }}
          >
            <p className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              {stat.value}
            </p>
            <p className="mt-1 text-sm text-white/80">{stat.label}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
