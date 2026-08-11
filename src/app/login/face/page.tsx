"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { motion } from "framer-motion";
import { CameraCapture } from "@/components/verification/camera-capture";
import { Button } from "@/components/ui/button";

function safeNext(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/dashboard";
  return raw;
}

function FaceChallengeInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNext(searchParams.get("next"));

  const [consent, setConsent] = React.useState(false);
  const [phase, setPhase] = React.useState<"consent" | "prepare" | "capture" | "done">(
    "consent",
  );
  const [verificationId, setVerificationId] = React.useState<string | null>(null);
  const [challenges, setChallenges] = React.useState<string[]>([]);
  const [isDev, setIsDev] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    (async () => {
      const me = await fetch("/api/auth/me");
      if (me.status === 401) {
        router.replace(`/login?next=${encodeURIComponent(next)}`);
        return;
      }
      const json = await me.json();
      if (json.ok && !json.data.requiresFaceVerification) {
        router.replace(next);
      }
    })();
  }, [router, next]);

  async function startChallenge() {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/auth/signin-face/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accepted: true }),
    });
    const json = await res.json();
    setBusy(false);
    if (res.status === 401) {
      router.replace(`/login?next=${encodeURIComponent(next)}`);
      return;
    }
    if (!json.ok) {
      setError(json.error?.message ?? "Could not start face verification");
      return;
    }
    if (json.data.alreadyVerified) {
      router.replace(next);
      return;
    }
    setVerificationId(json.data.verification.id);
    setChallenges(json.data.verification.challenges ?? []);
    setIsDev(Boolean(json.data.isDevelopment));
    setPhase("prepare");
  }

  async function onCaptureComplete(payload: {
    completedChallenges: string[];
    hints: Record<string, unknown>;
  }) {
    if (!verificationId) return;
    setBusy(true);
    setError(null);
    const res = await fetch("/api/auth/signin-face/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        verificationId,
        completedChallenges: payload.completedChallenges,
        hints: payload.hints,
      }),
    });
    const json = await res.json();
    setBusy(false);
    if (!json.ok) {
      setError(json.error?.message ?? "Verification failed");
      return;
    }
    if (json.data.verified) {
      setPhase("done");
      router.replace(next);
      return;
    }
    setError("Verification couldn't be completed. Please try again.");
    setPhase("consent");
    setConsent(false);
    setVerificationId(null);
  }

  return (
    <div className="relative min-h-[80vh] overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(34,197,94,0.1),_transparent_55%),linear-gradient(180deg,#f8faf8_0%,#eef6f0_100%)]" />
      <div className="container-page relative flex min-h-[80vh] items-center justify-center py-10">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md rounded-2xl border border-border bg-white/95 p-6 shadow-sm backdrop-blur md:p-8"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            FairPrice ID
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold">Confirm it&apos;s you</h1>
          <p className="mt-2 text-sm text-foreground-muted">
            Face + liveness is required after sign-in or registration. This reduces
            identity-related fraud risk — it does not guarantee marketplace safety.
          </p>

          {isDev ? (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950">
              Development verification — mock provider active.
            </div>
          ) : null}

          {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}

          {phase === "consent" ? (
            <div className="mt-6 space-y-4">
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-secondary/40 p-4 text-sm">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                />
                <span>
                  I understand and consent to face verification for this sign-in. Temporary
                  capture is processed and discarded — not sent to our AI models.
                </span>
              </label>
              <Button
                variant="lime"
                className="w-full"
                disabled={!consent || busy}
                onClick={() => void startChallenge()}
              >
                {busy ? "Starting…" : "Continue"}
              </Button>
              <Button asChild variant="ghost" className="w-full">
                <Link href="/api/auth/logout" onClick={async (e) => {
                  e.preventDefault();
                  await fetch("/api/auth/logout", { method: "POST" });
                  router.push("/login");
                }}>
                  Sign out instead
                </Link>
              </Button>
            </div>
          ) : null}

          {phase === "prepare" ? (
            <div className="mt-6 space-y-4">
              <ul className="list-disc space-y-1 pl-5 text-sm text-foreground-muted">
                <li>Find good lighting</li>
                <li>Look directly at the camera</li>
                <li>Remove anything blocking your face</li>
              </ul>
              <Button
                variant="lime"
                className="w-full"
                disabled={!verificationId || challenges.length === 0}
                onClick={() => setPhase("capture")}
              >
                Start camera
              </Button>
            </div>
          ) : null}

          {phase === "capture" ? (
            <div className="mt-6">
              <CameraCapture
                challenges={challenges}
                disabled={busy}
                onComplete={onCaptureComplete}
              />
            </div>
          ) : null}

          {phase === "done" ? (
            <p className="mt-6 text-center text-sm text-foreground-muted">Continuing…</p>
          ) : null}
        </motion.div>
      </div>
    </div>
  );
}

export default function LoginFacePage() {
  return (
    <Suspense>
      <FaceChallengeInner />
    </Suspense>
  );
}
