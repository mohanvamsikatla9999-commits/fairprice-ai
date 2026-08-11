"use client";

import { MapPin } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const DEFAULT_LOCATIONS = [
  "All India",
  "Bengaluru",
  "Mumbai",
  "Delhi NCR",
  "Hyderabad",
  "Chennai",
  "Pune",
  "Kolkata",
  "Ahmedabad",
];

export interface LocationSelectorProps {
  locations?: string[];
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
  placeholder?: string;
}

export function LocationSelector({
  locations = DEFAULT_LOCATIONS,
  value,
  onChange,
  className,
  placeholder = "Select location",
}: LocationSelectorProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={cn("w-full sm:w-[220px]", className)}>
        <div className="flex items-center gap-2 truncate">
          <MapPin className="h-4 w-4 shrink-0 text-primary" />
          <SelectValue placeholder={placeholder} />
        </div>
      </SelectTrigger>
      <SelectContent>
        {locations.map((loc) => (
          <SelectItem key={loc} value={loc}>
            {loc}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export { DEFAULT_LOCATIONS };
