"use client";

import Link from "next/link";
import {
  Car,
  Laptop,
  Shirt,
  Smartphone,
  Sofa,
  WashingMachine,
} from "lucide-react";
import { SectionHeading } from "@/components/shared/section-heading";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { id: "mobiles", label: "Phones", icon: Smartphone, tone: "from-[#1B4DFF] to-[#2563FF]" },
  { id: "laptops", label: "Laptops", icon: Laptop, tone: "from-[#1639c9] to-[#1B4DFF]" },
  { id: "cars", label: "Vehicles", icon: Car, tone: "from-[#0f2a9e] to-[#2563FF]" },
  { id: "furniture", label: "Furniture", icon: Sofa, tone: "from-[#1B4DFF] to-[#3b82f6]" },
  { id: "fashion", label: "Fashion", icon: Shirt, tone: "from-[#2563FF] to-[#60a5fa]" },
  {
    id: "appliances",
    label: "Appliances",
    icon: WashingMachine,
    tone: "from-[#1B4DFF] to-[#93c5fd]",
  },
];

export function CategoriesShowcase() {
  return (
    <section className="bg-background-muted py-20">
      <div className="container-page">
        <SectionHeading
          align="center"
          eyebrow="Categories"
          title="Shop by what you need."
          description="FairPrice coverage across India’s most active resale categories."
        />
        <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.id}
              href={`/category/${cat.id}`}
              className="group flex flex-col items-center gap-3 rounded-2xl border border-border bg-white p-5 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <span
                className={cn(
                  "flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-md",
                  cat.tone,
                )}
              >
                <cat.icon className="h-6 w-6" />
              </span>
              <span className="font-display text-sm font-semibold group-hover:text-primary">
                {cat.label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
