"use client";

import * as React from "react";
import { getStoredLocale, setStoredLocale, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function LanguageToggle({ className }: { className?: string }) {
  const [locale, setLocale] = React.useState<Locale>("en");

  React.useEffect(() => {
    setLocale(getStoredLocale());
  }, []);

  function toggle() {
    const next: Locale = locale === "en" ? "hi" : "en";
    setStoredLocale(next);
    setLocale(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className={cn(
        "rounded-full border border-border px-2.5 py-1 text-xs font-semibold uppercase tracking-wide hover:bg-secondary",
        className,
      )}
      aria-label="Toggle language"
    >
      {locale === "en" ? "हिं" : "EN"}
    </button>
  );
}
