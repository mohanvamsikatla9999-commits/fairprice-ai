"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function OnboardingPage() {
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [city, setCity] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/auth/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        displayName: name,
        city,
        roleIntent: "BOTH",
      }),
    });
    const json = await res.json();
    setBusy(false);
    if (!json.ok) {
      setError(json.error?.message ?? "Request failed");
      return;
    }
    router.push("/dashboard");
  }

  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-12">
      <div className="w-full max-w-md rounded-2xl border border-border bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          FairPrice AI
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold">Finish setup</h1>
        <p className="mt-2 text-sm text-foreground-muted">
          Tell us how you will use FairPrice
        </p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <Label>Name</Label>
            <Input
              className="mt-1.5"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <Label>City</Label>
            <Input
              className="mt-1.5"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button type="submit" variant="lime" className="w-full" disabled={busy}>
            {busy ? "Please wait…" : "Save and continue"}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-foreground-muted">
          <Link className="text-primary hover:underline" href="/dashboard">
            Skip for now
          </Link>
        </p>
      </div>
    </div>
  );
}
