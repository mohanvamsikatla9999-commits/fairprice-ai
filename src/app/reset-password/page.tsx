"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function FormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [token, setToken] = React.useState(searchParams.get("token") ?? "");
  const [password, setPassword] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSuccess(null);
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    const json = await res.json();
    setBusy(false);
    if (!json.ok) {
      setError(json.error?.message ?? "Request failed");
      return;
    }
    setSuccess("Password updated.");
    router.push("/login");
  }

  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-12">
      <div className="w-full max-w-md rounded-2xl border border-border bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          FairPrice AI
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold">Reset password</h1>
        <p className="mt-2 text-sm text-foreground-muted">Choose a new password</p>
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
          <div>
            <Label>Password</Label>
            <Input
              className="mt-1.5"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {success ? <p className="text-sm text-success">{success}</p> : null}
          <Button type="submit" variant="lime" className="w-full" disabled={busy}>
            {busy ? "Please wait…" : "Update password"}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-foreground-muted">
          <Link className="text-primary hover:underline" href="/login">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <FormInner />
    </Suspense>
  );
}
