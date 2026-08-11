import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatDistanceToNow } from "date-fns";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatInr(
  amount: number,
  options?: { compact?: boolean; maximumFractionDigits?: number },
): string {
  if (!Number.isFinite(amount)) return "₹—";

  if (options?.compact) {
    const abs = Math.abs(amount);
    if (abs >= 10_000_000) {
      return `₹${(amount / 10_000_000).toFixed(2).replace(/\.00$/, "")} Cr`;
    }
    if (abs >= 100_000) {
      return `₹${(amount / 100_000).toFixed(2).replace(/\.00$/, "")} L`;
    }
    if (abs >= 1_000) {
      return `₹${(amount / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
    }
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: options?.maximumFractionDigits ?? 0,
  }).format(Math.round(amount));
}

export function formatRelative(date: Date | string | number): string {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return "unknown";
  return formatDistanceToNow(d, { addSuffix: true });
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 120);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
