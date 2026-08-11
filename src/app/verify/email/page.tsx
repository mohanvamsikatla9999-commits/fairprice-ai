"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function FormInner() {
  const searchParams = useSearchParams();
  const [token, setToken] = React.useState(searchParams.get("token") ?? "");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSuccess(null);
    const res = await fetch("/api/auth/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    const json = await res.json();
    setBusy(false);
    if (!json.ok) {
      setError(json.error?.message ?? "Request failed");
      return;
    }
    setSuccess("Email verified.");
  }

  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-12">
      <div className="w-full max-w-md rounded-2xl border border-border bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          FairPrice AI
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold">Verify email</h1>
        <p className="mt-2 text-sm text-foreground-muted">
          Confirm your email address
        </p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <Label>Token</Label>
            <Input
              className="mt-1.5"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              required
            />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {success ? <p className="text-sm text-success">{success}</p> : null}
          <Button type="submit" variant="lime" className="w-full" disabled={busy}>
            {busy ? "Please wait…" : "Verify"}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-foreground-muted">
          <Link className="text-primary hover:underline" href="/verify">
            FairPrice ID
          </Link>
          {" · "}
          <Link className="text-primary hover:underline" href="/login">
            Continue
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <FormInner />
    </Suspense>
  );
}
