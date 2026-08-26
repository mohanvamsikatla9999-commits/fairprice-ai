"use client";

import * as React from "react";
import Link from "next/link";
import { formatInr } from "@/lib/utils";

type Valuation = {
  id: string;
  productLabel: string;
  fairValueMinInr: number;
  fairValueMaxInr: number;
  fairValueMidInr: number;
  recommendedListingInr: number;
  conditionScore: number;
  priceConfidence: number;
  verdict: string;
  comparableCount: number;
  engineVersion: string;
  createdAt: string;
  listing: { id: string; title: string } | null;
  user: { id: string; email: string; name: string | null } | null;
};

const VERDICT_COLOR: Record<string, string> = {
  FAIR: "bg-green-100 text-green-700",
  UNDERPRICED: "bg-blue-100 text-blue-700",
  SLIGHTLY_HIGH: "bg-amber-100 text-amber-700",
  OVERPRICED: "bg-red-100 text-red-600",
  UNKNOWN: "bg-gray-100 text-gray-600",
};

export default function AdminValuationsPage() {
  const [items, setItems] = React.useState<Valuation[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState("");

  React.useEffect(() => {
    fetch("/api/admin/valuations")
      .then((r) => r.json())
      .then((j) => { if (j.ok) setItems(j.data.valuations ?? []); })
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter
    ? items.filter(
        (v) =>
          v.productLabel.toLowerCase().includes(filter.toLowerCase()) ||
          v.user?.email.toLowerCase().includes(filter.toLowerCase()) ||
          v.verdict.toLowerCase().includes(filter.toLowerCase()),
      )
    : items;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Valuations</h1>
        <p className="mt-1 text-sm text-foreground-muted">Recent AI valuation history across all users</p>
      </div>

      <input
        className="w-full max-w-sm rounded-xl border border-border px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        placeholder="Filter by product, user, verdict…"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      />

      <div className="rounded-2xl border border-border bg-white shadow-sm overflow-x-auto">
        <table className="w-full min-w-[800px] text-sm">
          <thead className="border-b border-border bg-secondary/50">
            <tr>
              {["Product", "Fair range", "Verdict", "Confidence", "Comps", "User", "Date"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-foreground-muted">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-foreground-muted">Loading…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-foreground-muted">No valuations found.</td></tr>
            ) : filtered.map((v) => (
              <tr key={v.id} className="hover:bg-secondary/20">
                <td className="px-4 py-3">
                  <p className="font-medium line-clamp-1">{v.productLabel}</p>
                  {v.listing && (
                    <Link href={`/product/${v.listing.id}`} className="text-xs text-primary hover:underline line-clamp-1">
                      {v.listing.title}
                    </Link>
                  )}
                </td>
                <td className="px-4 py-3 font-mono text-xs">
                  {formatInr(v.fairValueMinInr)} – {formatInr(v.fairValueMaxInr)}
                  <p className="text-foreground-muted">mid {formatInr(v.fairValueMidInr)}</p>
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${VERDICT_COLOR[v.verdict] ?? "bg-gray-100 text-gray-600"}`}>
                    {v.verdict.replace(/_/g, " ")}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-16 rounded-full bg-border overflow-hidden">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${Math.round(v.priceConfidence * 100)}%` }} />
                    </div>
                    <span className="text-xs text-foreground-muted">{Math.round(v.priceConfidence * 100)}%</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-foreground-muted">{v.comparableCount}</td>
                <td className="px-4 py-3 text-xs text-foreground-muted">{v.user?.name || v.user?.email || "Anonymous"}</td>
                <td className="px-4 py-3 text-xs text-foreground-muted">{new Date(v.createdAt).toLocaleDateString("en-IN")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-foreground-muted">{filtered.length} valuations</p>
    </div>
  );
}
