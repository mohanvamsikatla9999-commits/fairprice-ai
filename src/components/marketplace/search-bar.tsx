"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface SearchBarProps {
  defaultValue?: string;
  placeholder?: string;
  onSearch?: (query: string) => void;
  className?: string;
  size?: "default" | "lg";
}

export function SearchBar({
  defaultValue = "",
  placeholder = "What are you looking for?",
  onSearch,
  className,
  size = "default",
}: SearchBarProps) {
  const [query, setQuery] = React.useState(defaultValue);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSearch?.(query.trim());
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "flex w-full items-center gap-2 rounded-2xl border border-border bg-white p-1.5 shadow-sm",
        size === "lg" && "p-2 shadow-lg",
        className,
      )}
    >
      <div className="relative min-w-0 flex-1">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-muted" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          className={cn(
            "border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0",
            size === "lg" ? "h-12 pl-11 text-base" : "h-11 pl-10",
          )}
        />
      </div>
      <Button type="submit" variant="lime" size={size === "lg" ? "lg" : "default"}>
        Search
      </Button>
    </form>
  );
}
