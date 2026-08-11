"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AdminVerificationPage() {
  const router = useRouter();
  const [data, setData] = React.useState<any>(null);
  const [cases, setCases] = React.useState<any[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [threshold, setThreshold] = React.useState("50000");

  async function load() {
    const res = await fetch("/api/admin/verification");
    if (res.status === 401 || res.status === 403) {
      router.push("/login?next=/admin/verification");
      return;
    }
    const json = await res.json();
    if (!json.ok) {
      setError(json.error?.message ?? "Failed to load");
      return;
    }
    setData(json.data);
    setThreshold(String(json.data.policy.requireIdentityAboveInr));
    const reviews = await fetch("/api/admin/verification/reviews");
    const rJson = await reviews.json();
    if (rJson.ok) setCases(rJson.data.cases);
  }

  React.useEffect(() => {
    void load();
  }, [router]);

  async function savePolicy() {
    const res = await fetch("/api/admin/verification", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requireIdentityAboveInr: Number(threshold) }),
    });
    const json = await res.json();
    if (json.ok) await load();
    else setError(json.error?.message);
  }

  async function decide(id: string, decision: "APPROVED" | "REJECTED" | "ESCALATED") {
    await fetch(`/api/admin/verification/reviews/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision }),
    });
    await load();
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-border bg-white p-8">
        <h1 className="font-display text-2xl font-bold">Verification</h1>
        <p className="mt-2 text-sm text-destructive">{error}</p>
      </div>
    );
  }

  if (!data) return <p className="text-sm text-foreground-muted">Loading…</p>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold">FairPrice ID</h1>
        <p className="mt-1 text-sm text-foreground-muted">
          Metadata and review only — biometric material is not exposed here.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Verified", data.stats.verified],
          ["Failed", data.stats.failed],
          ["Pending review", data.stats.pendingReview],
          ["Success rate", `${data.stats.successRate}%`],
        ].map(([label, value]) => (
          <div key={label as string} className="rounded-2xl border border-border bg-white p-4">
            <p className="text-xs uppercase tracking-wider text-foreground-muted">{label}</p>
            <p className="mt-1 font-display text-2xl font-semibold">{value}</p>
          </div>
        ))}
      </div>

      <section className="rounded-2xl border border-border bg-white p-5">
        <h2 className="font-display text-xl font-semibold">High-value listing policy</h2>
        <p className="mt-1 text-sm text-foreground-muted">
          Require identity verification when listing price is at or above this threshold (INR).
        </p>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <div>
            <Label>Threshold (₹)</Label>
            <Input
              className="mt-1.5 w-40"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
            />
          </div>
          <Button onClick={savePolicy}>Save</Button>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl font-semibold">Review cases</h2>
        {cases.length === 0 ? (
          <p className="text-sm text-foreground-muted">No open cases.</p>
        ) : (
          cases.map((c) => (
            <div key={c.id} className="rounded-xl border border-border bg-white px-4 py-3">
              <p className="font-medium">
                {c.status} · {c.user?.email}
              </p>
              <p className="text-sm text-foreground-muted">{c.reason}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Button size="sm" onClick={() => decide(c.id, "APPROVED")}>
                  Approve
                </Button>
                <Button size="sm" variant="outline" onClick={() => decide(c.id, "REJECTED")}>
                  Reject
                </Button>
                <Button size="sm" variant="soft" onClick={() => decide(c.id, "ESCALATED")}>
                  Escalate
                </Button>
              </div>
            </div>
          ))
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl font-semibold">Recent verifications</h2>
        {(data.recent ?? []).map((r: any) => (
          <div key={r.id} className="rounded-xl border border-border bg-white px-4 py-3 text-sm">
            <p className="font-medium">
              {r.status} · {r.user?.email}
              {r.isDevelopment ? " · Development" : ""}
            </p>
            <p className="text-foreground-muted">
              {r.provider} · risk {r.riskClass} · {new Date(r.createdAt).toLocaleString()}
            </p>
          </div>
        ))}
      </section>
    </div>
  );
}
