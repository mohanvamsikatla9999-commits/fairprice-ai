"use client";

import * as React from "react";
import { MapPin, Navigation } from "lucide-react";
import { INDIA_CITIES, type IndiaCity } from "@/config/india-cities";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "fp_city";

export function loadSavedCity(): IndiaCity | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as IndiaCity;
  } catch {
    return null;
  }
}

export function saveCity(city: IndiaCity | null) {
  if (typeof window === "undefined") return;
  if (!city) localStorage.removeItem(STORAGE_KEY);
  else localStorage.setItem(STORAGE_KEY, JSON.stringify(city));
}

export function CityPicker({
  value,
  onChange,
  className,
  compact,
}: {
  value: IndiaCity | null;
  onChange: (city: IndiaCity | null) => void;
  className?: string;
  compact?: boolean;
}) {
  const [open, setOpen] = React.useState(false);

  function pick(city: IndiaCity) {
    saveCity(city);
    onChange(city);
    setOpen(false);
  }

  function nearMe() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      const { latitude, longitude } = pos.coords;
      let best = INDIA_CITIES[0]!;
      let bestD = Infinity;
      for (const c of INDIA_CITIES) {
        const d =
          (c.lat - latitude) ** 2 + (c.lng - longitude) ** 2;
        if (d < bestD) {
          bestD = d;
          best = c;
        }
      }
      pick({ ...best, lat: latitude, lng: longitude });
    });
  }

  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-3 py-1.5 text-sm font-medium hover:bg-secondary",
          compact && "px-2.5 py-1 text-xs",
        )}
      >
        <MapPin className="h-3.5 w-3.5 text-primary" />
        {value?.name ?? "All India"}
      </button>
      {open ? (
        <div className="absolute left-0 top-full z-50 mt-2 w-64 rounded-2xl border border-border bg-white p-3 shadow-lg">
          <Button
            type="button"
            variant="soft"
            size="sm"
            className="mb-2 w-full justify-start gap-2"
            onClick={nearMe}
          >
            <Navigation className="h-3.5 w-3.5" />
            Near me
          </Button>
          <button
            type="button"
            className="mb-1 w-full rounded-lg px-2 py-1.5 text-left text-sm hover:bg-secondary"
            onClick={() => {
              saveCity(null);
              onChange(null);
              setOpen(false);
            }}
          >
            All India
          </button>
          <div className="max-h-56 overflow-y-auto">
            {INDIA_CITIES.map((c) => (
              <button
                key={c.slug}
                type="button"
                className="w-full rounded-lg px-2 py-1.5 text-left text-sm hover:bg-secondary"
                onClick={() => pick(c)}
              >
                {c.name}
                <span className="text-foreground-muted"> · {c.state}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
