"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
  const [email, setEmail] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSuccess(null);
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const json = await res.json();
    setBusy(false);
    if (!json.ok) {
      setError(json.error?.message ?? "Request failed");
      return;
    }
    setSuccess("If that email exists, a reset link was sent.");
  }

  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-12">
      <div className="w-full max-w-md rounded-2xl border border-border bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          FairPrice AI
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold">Forgot password</h1>
        <p className="mt-2 text-sm text-foreground-muted">
          We will email a reset link
        </p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <Label>Email</Label>
            <Input
              className="mt-1.5"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {success ? <p className="text-sm text-success">{success}</p> : null}
          <Button type="submit" variant="lime" className="w-full" disabled={busy}>
            {busy ? "Please wait…" : "Send reset link"}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-foreground-muted">
          <Link className="text-primary hover:underline" href="/login">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
