"use client";

import {
  Car,
  Laptop,
  Shirt,
  Smartphone,
  Sofa,
  WashingMachine,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface CategoryOption {
  id: string;
  label: string;
  icon?: LucideIcon;
}

const DEFAULT_CATEGORIES: CategoryOption[] = [
  { id: "phones", label: "Phones", icon: Smartphone },
  { id: "laptops", label: "Laptops", icon: Laptop },
  { id: "vehicles", label: "Vehicles", icon: Car },
  { id: "furniture", label: "Furniture", icon: Sofa },
  { id: "fashion", label: "Fashion", icon: Shirt },
  { id: "appliances", label: "Appliances", icon: WashingMachine },
];

export interface CategorySelectorProps {
  categories?: CategoryOption[];
  value?: string | null;
  onChange?: (id: string) => void;
  className?: string;
}

export function CategorySelector({
  categories = DEFAULT_CATEGORIES,
  value,
  onChange,
  className,
}: CategorySelectorProps) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)} role="listbox" aria-label="Categories">
      {categories.map((cat) => {
        const Icon = cat.icon;
        const selected = value === cat.id;
        return (
          <button
            key={cat.id}
            type="button"
            role="option"
            aria-selected={selected}
            onClick={() => onChange?.(cat.id)}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition",
              selected
                ? "border-primary bg-primary text-primary-foreground shadow-sm"
                : "border-border bg-white text-foreground hover:border-primary/40 hover:bg-secondary",
            )}
          >
            {Icon ? <Icon className="h-4 w-4" /> : null}
            {cat.label}
          </button>
        );
      })}
    </div>
  );
}

export { DEFAULT_CATEGORIES };
