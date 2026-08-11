"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CameraCapture } from "@/components/verification/camera-capture";
import { Button } from "@/components/ui/button";

export default function VerifyFacePage() {
  const router = useRouter();
  const [verificationId, setVerificationId] = React.useState<string | null>(null);
  const [challenges, setChallenges] = React.useState<string[]>([]);
  const [isDev, setIsDev] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [phase, setPhase] = React.useState<"prepare" | "capture" | "submitting">("prepare");

  React.useEffect(() => {
    (async () => {
      const consentId = sessionStorage.getItem("fp_idv_consent");
      if (!consentId) {
        router.replace("/verify/identity");
        return;
      }
      const res = await fetch("/api/verification/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consentId }),
      });
      if (res.status === 401) {
        router.push("/login?next=/verify/face");
        return;
      }
      const json = await res.json();
      if (!json.ok) {
        setError(json.error?.message ?? "Could not start verification");
        return;
      }
      setVerificationId(json.data.verification.id);
      setChallenges(json.data.verification.challenges ?? []);
      setIsDev(Boolean(json.data.isDevelopment));
    })();
  }, [router]);

  async function onCaptureComplete(payload: {
    completedChallenges: string[];
    hints: Record<string, unknown>;
  }) {
    if (!verificationId) return;
    setPhase("submitting");
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/verification/${verificationId}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        completedChallenges: payload.completedChallenges,
        hints: payload.hints,
      }),
    });
    const json = await res.json();
    setBusy(false);
    if (!json.ok) {
      setError(json.error?.message ?? "Verification failed");
      router.push(`/verify/failed?id=${verificationId}`);
      return;
    }
    const status = json.data.verification.status as string;
    if (status === "VERIFIED") {
      router.push(`/verify/success?id=${verificationId}`);
    } else if (status === "REVIEW_REQUIRED") {
      router.push(`/verify/review?id=${verificationId}`);
    } else {
      router.push(`/verify/failed?id=${verificationId}`);
    }
  }

  return (
    <div className="container-page max-w-xl py-10">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">FairPrice ID</p>
      <h1 className="mt-2 font-display text-3xl font-bold">Face + liveness</h1>
      <p className="mt-2 text-sm text-foreground-muted">
        Confirm you&apos;re a real person. We process capture briefly and discard temporary biometric
        data — we do not send face images to our LLM.
      </p>

      {isDev ? (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          Development verification — not a production identity credential.
        </div>
      ) : null}

      {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}

      {phase === "prepare" ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 space-y-4 rounded-2xl border border-border bg-white p-6"
        >
          <h2 className="font-display text-xl font-semibold">Prepare</h2>
          <ul className="list-disc space-y-1 pl-5 text-sm text-foreground-muted">
            <li>Find a well-lit space</li>
            <li>Remove sunglasses or face coverings</li>
            <li>Hold the device at arm&apos;s length</li>
            <li>Stay on this page until finished</li>
          </ul>
          <Button
            variant="lime"
            className="w-full"
            disabled={!verificationId || challenges.length === 0}
            onClick={() => setPhase("capture")}
          >
            Start camera
          </Button>
        </motion.div>
      ) : null}

      {phase === "capture" || phase === "submitting" ? (
        <div className="mt-8">
          <CameraCapture
            challenges={challenges}
            disabled={busy}
            onComplete={onCaptureComplete}
          />
          {phase === "submitting" ? (
            <p className="mt-4 text-center text-sm text-foreground-muted">Verifying…</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
