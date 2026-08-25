"use client";

import * as React from "react";
import { formatInr } from "@/lib/utils";

type Comparable = {
  id: string;
  title: string;
  priceInr: number;
  conditionGrade: string | null;
  city: string | null;
  state: string | null;
  source: string;
  ageMonths: number | null;
  isSynthetic: boolean;
  listedAt: string | null;
  createdAt: string;
};

type Snapshot = {
  id: string;
  source: string;
  medianInr: number;
  sampleSize: number;
  conditionGrade: string | null;
  location: string | null;
  capturedAt: string;
  product: { brand: string; name: string } | null;
};

export default function AdminMarketDataPage() {
  const [comps, setComps] = React.useState<Comparable[]>([]);
  const [snapshots, setSnapshots] = React.useState<Snapshot[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [tab, setTab] = React.useState<"comps" | "snapshots">("comps");
  const [filter, setFilter] = React.useState("");

  React.useEffect(() => {
    Promise.all([
      fetch("/api/admin/market-data/comparables").then((r) => r.json()),
      fetch("/api/admin/market-data/snapshots").then((r) => r.json()),
    ]).then(([c, s]) => {
      if (c.ok) setComps(c.data.comparables ?? []);
      if (s.ok) setSnapshots(s.data.snapshots ?? []);
    }).finally(() => setLoading(false));
  }, []);

  const filteredComps = filter
    ? comps.filter((c) => c.title.toLowerCase().includes(filter.toLowerCase()) || (c.city ?? "").toLowerCase().includes(filter.toLowerCase()))
    : comps;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Market data</h1>
        <p className="mt-1 text-sm text-foreground-muted">Comparable listings and price snapshots used by the valuation engine</p>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setTab("comps")}
          className={`rounded-full px-4 py-2 text-sm font-medium transition ${tab === "comps" ? "bg-primary text-white" : "border border-border bg-white"}`}
        >
          Comparables ({comps.length})
        </button>
        <button
          type="button"
          onClick={() => setTab("snapshots")}
          className={`rounded-full px-4 py-2 text-sm font-medium transition ${tab === "snapshots" ? "bg-primary text-white" : "border border-border bg-white"}`}
        >
          Price snapshots ({snapshots.length})
        </button>
      </div>

      {tab === "comps" && (
        <>
          <input
            className="w-full max-w-sm rounded-xl border border-border px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Filter by title or city…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          <div className="rounded-2xl border border-border bg-white shadow-sm overflow-x-auto">
            <table className="w-full min-w-[700px] text-sm">
              <thead className="border-b border-border bg-secondary/50">
                <tr>
                  {["Title", "Price", "Condition", "City", "Source", "Age", "Listed"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-foreground-muted">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-foreground-muted">Loading…</td></tr>
                ) : filteredComps.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-foreground-muted">No comparable listings. Run db:seed-comps to seed market data.</td></tr>
                ) : filteredComps.map((c) => (
                  <tr key={c.id} className="hover:bg-secondary/20">
                    <td className="px-4 py-3">
                      <p className="font-medium line-clamp-1">{c.title}</p>
                      {c.isSynthetic && <span className="text-xs text-amber-600">(synthetic)</span>}
                    </td>
                    <td className="px-4 py-3 font-medium">{formatInr(c.priceInr)}</td>
                    <td className="px-4 py-3 text-foreground-muted text-xs">{c.conditionGrade?.replace(/_/g, " ") ?? "—"}</td>
                    <td className="px-4 py-3 text-foreground-muted text-xs">{[c.city, c.state].filter(Boolean).join(", ") || "—"}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium">{c.source}</span>
                    </td>
                    <td className="px-4 py-3 text-foreground-muted text-xs">{c.ageMonths != null ? `${c.ageMonths}m` : "—"}</td>
                    <td className="px-4 py-3 text-xs text-foreground-muted">
                      {c.listedAt ? new Date(c.listedAt).toLocaleDateString("en-IN") : new Date(c.createdAt).toLocaleDateString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === "snapshots" && (
        <div className="rounded-2xl border border-border bg-white shadow-sm overflow-x-auto">
          <table className="w-full min-w-[600px] text-sm">
            <thead className="border-b border-border bg-secondary/50">
              <tr>
                {["Product", "Median price", "Sample", "Condition", "Source", "Captured"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-foreground-muted">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-foreground-muted">Loading…</td></tr>
              ) : snapshots.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-foreground-muted">No price snapshots yet.</td></tr>
              ) : snapshots.map((s) => (
                <tr key={s.id} className="hover:bg-secondary/20">
                  <td className="px-4 py-3 font-medium">{s.product ? `${s.product.brand} ${s.product.name}` : "—"}</td>
                  <td className="px-4 py-3 font-medium">{formatInr(s.medianInr)}</td>
                  <td className="px-4 py-3 text-foreground-muted">{s.sampleSize}</td>
                  <td className="px-4 py-3 text-xs text-foreground-muted">{s.conditionGrade?.replace(/_/g, " ") ?? "All"}</td>
                  <td className="px-4 py-3"><span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium">{s.source}</span></td>
                  <td className="px-4 py-3 text-xs text-foreground-muted">{new Date(s.capturedAt).toLocaleDateString("en-IN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
