"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AlertsPage() {
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [city, setCity] = React.useState("");
  const [maxPrice, setMaxPrice] = React.useState("");
  const [items, setItems] = React.useState<any[]>([]);
  const [message, setMessage] = React.useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/alerts");
    if (res.status === 401) {
      router.push("/login?next=/alerts");
      return;
    }
    const json = await res.json();
    if (json.ok) setItems(json.data.searches ?? []);
  }

  React.useEffect(() => {
    void load();
  }, [router]);

  async function create() {
    const res = await fetch("/api/alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        query: name,
        city: city || undefined,
        maxPriceInr: maxPrice ? Number(maxPrice) : undefined,
        alert: true,
      }),
    });
    const json = await res.json();
    setMessage(json.ok ? "Alert saved — we'll watch for matches." : json.error?.message);
    if (json.ok) {
      setName("");
      await load();
    }
  }

  return (
    <div className="container-page max-w-2xl py-12">
      <h1 className="font-display text-3xl font-bold">Saved searches & alerts</h1>
      <p className="mt-2 text-sm text-foreground-muted">
        Get notified when FairPrice finds matching deals in your city.
      </p>

      <div className="mt-8 space-y-4 rounded-2xl border border-border bg-white p-6">
        <div>
          <Label>What are you looking for?</Label>
          <Input
            className="mt-1.5"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="iPhone 13 under 35k"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>City</Label>
            <Input
              className="mt-1.5"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Hyderabad"
            />
          </div>
          <div>
            <Label>Max price (₹)</Label>
            <Input
              className="mt-1.5"
              type="number"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
            />
          </div>
        </div>
        <Button variant="lime" onClick={() => void create()} disabled={!name.trim()}>
          Save alert
        </Button>
        {message ? <p className="text-sm text-foreground-muted">{message}</p> : null}
      </div>

      <div className="mt-8 space-y-3">
        {items.map((s) => (
          <div key={s.id} className="rounded-xl border border-border bg-white px-4 py-3">
            <p className="font-medium">{s.name || s.query}</p>
            <p className="text-xs text-foreground-muted">
              {s.alertEnabled ? "Alerts on" : "Saved only"} ·{" "}
              {new Date(s.createdAt).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
