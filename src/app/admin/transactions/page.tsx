"use client";

import * as React from "react";
import Link from "next/link";
import { formatInr } from "@/lib/utils";

type Transaction = {
  id: string;
  status: string;
  amountInr: number | null;
  createdAt: string;
  completedAt: string | null;
  listing: { id: string; title: string; priceInr: number } | null;
  buyer: { id: string; name: string | null; email: string } | null;
  seller: { id: string; name: string | null; email: string } | null;
};

const STATUS_COLOR: Record<string, string> = {
  COMPLETED: "bg-green-100 text-green-700",
  INTERESTED: "bg-blue-100 text-blue-700",
  OFFER_ACCEPTED: "bg-primary/10 text-primary",
  PAYMENT_CONFIRMED: "bg-amber-100 text-amber-700",
  CANCELLED: "bg-red-100 text-red-600",
  DISPUTED: "bg-red-100 text-red-600",
};

export default function AdminTransactionsPage() {
  const [items, setItems] = React.useState<Transaction[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState("");

  React.useEffect(() => {
    fetch("/api/admin/transactions")
      .then((r) => r.json())
      .then((j) => { if (j.ok) setItems(j.data.transactions ?? []); })
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter
    ? items.filter(
        (t) =>
          t.listing?.title.toLowerCase().includes(filter.toLowerCase()) ||
          t.buyer?.email.toLowerCase().includes(filter.toLowerCase()) ||
          t.status.toLowerCase().includes(filter.toLowerCase()),
      )
    : items;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Transactions</h1>
        <p className="mt-1 text-sm text-foreground-muted">
          Deal pipeline: interested → offer → payment → completed
        </p>
      </div>

      <input
        className="w-full max-w-sm rounded-xl border border-border px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        placeholder="Filter by title, buyer email, status…"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      />

      <div className="rounded-2xl border border-border bg-white shadow-sm overflow-x-auto">
        <table className="w-full min-w-[700px] text-sm">
          <thead className="border-b border-border bg-secondary/50">
            <tr>
              {["Status", "Listing", "Buyer", "Seller", "Amount", "Started", "Completed"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-foreground-muted">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-foreground-muted">Loading…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-foreground-muted">No transactions found.</td></tr>
            ) : filtered.map((t) => (
              <tr key={t.id} className="hover:bg-secondary/20">
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_COLOR[t.status] ?? "bg-gray-100 text-gray-600"}`}>
                    {t.status.replace(/_/g, " ")}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {t.listing ? (
                    <Link href={`/product/${t.listing.id}`} className="font-medium hover:text-primary hover:underline line-clamp-1">
                      {t.listing.title}
                    </Link>
                  ) : <span className="text-foreground-muted">—</span>}
                  {t.listing && <p className="text-xs text-foreground-muted">{formatInr(t.listing.priceInr)}</p>}
                </td>
                <td className="px-4 py-3 text-foreground-muted">{t.buyer?.name || t.buyer?.email || "—"}</td>
                <td className="px-4 py-3 text-foreground-muted">{t.seller?.name || t.seller?.email || "—"}</td>
                <td className="px-4 py-3 font-medium">{t.amountInr ? formatInr(t.amountInr) : "—"}</td>
                <td className="px-4 py-3 text-xs text-foreground-muted">{new Date(t.createdAt).toLocaleDateString("en-IN")}</td>
                <td className="px-4 py-3 text-xs text-foreground-muted">
                  {t.completedAt ? new Date(t.completedAt).toLocaleDateString("en-IN") : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-foreground-muted">{filtered.length} transactions</p>
    </div>
  );
}
