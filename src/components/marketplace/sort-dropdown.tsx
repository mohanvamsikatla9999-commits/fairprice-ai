"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type SortOption =
  | "relevance"
  | "price_asc"
  | "price_desc"
  | "newest"
  | "fair_first";

const OPTIONS: { value: SortOption; label: string }[] = [
  { value: "relevance", label: "Most relevant" },
  { value: "newest", label: "Newest first" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
  { value: "fair_first", label: "FairPrice first" },
];

export interface SortDropdownProps {
  value?: SortOption;
  onChange?: (value: SortOption) => void;
  className?: string;
}

export function SortDropdown({
  value = "relevance",
  onChange,
  className,
}: SortDropdownProps) {
  return (
    <Select value={value} onValueChange={(v) => onChange?.(v as SortOption)}>
      <SelectTrigger className={cn("w-full sm:w-[200px]", className)}>
        <SelectValue placeholder="Sort by" />
      </SelectTrigger>
      <SelectContent>
        {OPTIONS.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
