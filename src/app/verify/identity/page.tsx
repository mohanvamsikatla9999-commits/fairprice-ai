"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

const STEPS = ["Consent", "Prepare", "Face capture", "Liveness", "Verification", "Complete"];

export default function VerifyIdentityPage() {
  const router = useRouter();
  const [consent, setConsent] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function continueFlow() {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/verification/consent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accepted: true }),
    });
    const json = await res.json();
    setBusy(false);
    if (res.status === 401) {
      router.push("/login?next=/verify/identity");
      return;
    }
    if (!json.ok) {
      setError(json.error?.message ?? "Could not record consent");
      return;
    }
    sessionStorage.setItem("fp_idv_consent", json.data.consentId);
    router.push("/verify/face");
  }

  return (
    <div className="container-page max-w-2xl py-12">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">FairPrice ID</p>
      <h1 className="mt-2 font-display text-3xl font-bold">Identity verification</h1>
      <p className="mt-2 text-foreground-muted">
        Confirm you&apos;re a real person and protect your FairPrice account.
      </p>

      <ol className="mt-6 flex flex-wrap gap-2 text-xs font-medium text-foreground-muted">
        {STEPS.map((step, i) => (
          <li
            key={step}
            className={
              i === 0
                ? "rounded-full bg-primary px-3 py-1 text-primary-foreground"
                : "rounded-full bg-secondary px-3 py-1"
            }
          >
            {i + 1}. {step}
          </li>
        ))}
      </ol>

      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-8 space-y-4 rounded-2xl border border-border bg-white p-6"
      >
        <h2 className="font-display text-xl font-semibold">Consent</h2>
        <div className="space-y-3 text-sm leading-relaxed text-foreground-muted">
          <p>
            <strong className="text-foreground">Why:</strong> FairPrice ID helps reduce fake
            accounts, impersonation, and identity-related fraud risk on the marketplace.
          </p>
          <p>
            <strong className="text-foreground">What we collect:</strong> verification status,
            timestamps, method, provider reference, and risk classification metadata. We do{" "}
            <em>not</em> permanently store raw face images by default.
          </p>
          <p>
            <strong className="text-foreground">How it&apos;s used:</strong> to update your
            FairPrice ID level and as one signal among many in trust and fraud systems.
          </p>
          <p>
            <strong className="text-foreground">Retention:</strong> verification metadata is kept
            per policy (default up to 365 days). Temporary capture data is discarded after
            processing.
          </p>
          <p>
            <strong className="text-foreground">Deletion:</strong> you can request deletion from{" "}
            <Link href="/settings/privacy" className="text-primary underline">
              Privacy settings
            </Link>
            , subject to legal retention where required.
          </p>
          <p>
            <strong className="text-foreground">If verification fails:</strong> you can retry
            (within limits), contact support, or request manual review. We will not disclose
            internal anti-fraud rules.
          </p>
        </div>

        <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-secondary/40 p-4 text-sm">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
          />
          <span>
            I understand and consent to identity and face verification, including biometric
            processing for liveness checks.
          </span>
        </label>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <Button
          variant="lime"
          className="w-full"
          disabled={!consent || busy}
          onClick={continueFlow}
        >
          {busy ? "Saving consent…" : "Continue"}
        </Button>
      </motion.section>
    </div>
  );
}
