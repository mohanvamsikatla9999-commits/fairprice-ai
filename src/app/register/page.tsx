"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneAuthForm } from "@/components/auth/phone-auth-form";

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M12 10.2v3.6h5.1c-.2 1.2-1.5 3.6-5.1 3.6-3.1 0-5.6-2.5-5.6-5.6S8.9 6.2 12 6.2c1.8 0 2.9.7 3.6 1.4l2.4-2.4C16.5 3.7 14.5 2.8 12 2.8 6.9 2.8 2.8 6.9 2.8 12S6.9 21.2 12 21.2c5.2 0 8.6-3.6 8.6-8.7 0-.6-.1-1-.2-1.5H12z"
      />
      <path fill="#34A853" d="M3.9 7.4l3 2.2C7.7 7.5 9.7 6.2 12 6.2c1.8 0 2.9.7 3.6 1.4l2.4-2.4C16.5 3.7 14.5 2.8 12 2.8 8.4 2.8 5.3 4.9 3.9 7.4z" />
      <path fill="#4A90E2" d="M12 21.2c2.4 0 4.5-.8 6-2.2l-2.9-2.2c-.8.6-1.9 1-3.1 1-2.4 0-4.4-1.6-5.1-3.8l-3 2.3c1.4 2.8 4.3 4.9 8.1 4.9z" />
      <path fill="#FBBC05" d="M6.9 14c-.2-.6-.3-1.2-.3-1.9s.1-1.3.3-1.9l-3-2.3C3.3 9.1 3 10.5 3 12s.3 2.9.9 4.1L6.9 14z" />
    </svg>
  );
}

function FormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [mode, setMode] = React.useState<"phone" | "email">("phone");

  function goNext(requiresFace?: boolean) {
    const dest = searchParams.get("next") || "/onboarding";
    if (requiresFace) {
      router.push(`/login/face?next=${encodeURIComponent(dest)}`);
      return;
    }
    router.push(dest);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const json = await res.json();
    setBusy(false);
    if (!json.ok) {
      setError(json.error?.message ?? "Request failed");
      return;
    }
    goNext(json.data.requiresFaceVerification);
  }

  const next = searchParams.get("next") || "/onboarding";
  const googleHref = `/api/auth/google?mode=signup&next=${encodeURIComponent(next)}`;

  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-12">
      <div className="w-full max-w-md rounded-2xl border border-border bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          FairPrice AI
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold">Create account</h1>
        <p className="mt-2 text-sm text-foreground-muted">
          Join with phone OTP in seconds — India&apos;s smarter way to buy & sell.
        </p>

        <div className="mt-6">
          {mode === "phone" ? (
            <PhoneAuthForm
              onSuccess={({ requiresFaceVerification }) => goNext(requiresFaceVerification)}
            />
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
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
                <Label>Email</Label>
                <Input
                  className="mt-1.5"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
              <Button type="submit" variant="lime" className="w-full" disabled={busy}>
                {busy ? "Please wait…" : "Create account"}
              </Button>
            </form>
          )}
        </div>

        <button
          type="button"
          className="mt-4 w-full text-sm text-primary hover:underline"
          onClick={() => setMode(mode === "phone" ? "email" : "phone")}
        >
          {mode === "phone" ? "Use email instead" : "Use phone OTP instead"}
        </button>

        <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-wide text-foreground-muted">
          <div className="h-px flex-1 bg-border" />
          or
          <div className="h-px flex-1 bg-border" />
        </div>

        <a
          href={googleHref}
          className="flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-medium shadow-sm transition hover:bg-secondary"
        >
          <GoogleIcon />
          Continue with Google
        </a>

        <p className="mt-4 text-center text-sm text-foreground-muted">
          <Link className="text-primary hover:underline" href="/login">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <FormInner />
    </Suspense>
  );
}
