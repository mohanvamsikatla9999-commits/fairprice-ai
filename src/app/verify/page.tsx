"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { motion } from "framer-motion";
import { BadgeCheck, ScanFace, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LEVEL_LABELS, type FairPriceIdLevel } from "@/services/verification/levels";

function VerifyHubInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = React.useState<{
    fairPriceIdLevel: FairPriceIdLevel;
    flags: Record<string, boolean>;
    developmentMode: boolean;
    requiresReverification: boolean;
  } | null>(null);

  React.useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      router.replace(`/verify/email?token=${encodeURIComponent(token)}`);
      return;
    }
    (async () => {
      const res = await fetch("/api/verification");
      if (res.status === 401) {
        router.push("/login?next=/verify");
        return;
      }
      const json = await res.json();
      if (json.ok) setStatus(json.data);
    })();
  }, [router, searchParams]);

  return (
    <div className="relative min-h-[80vh] overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(34,197,94,0.12),_transparent_55%),linear-gradient(180deg,#f8faf8_0%,#eef6f0_100%)]" />
      <div className="container-page relative py-12 md:py-16">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto max-w-2xl"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
            FairPrice ID
          </p>
          <h1 className="mt-3 font-display text-4xl font-bold tracking-tight md:text-5xl">
            Verify your identity
          </h1>
          <p className="mt-3 text-base text-foreground-muted md:text-lg">
            Confirm you&apos;re a real person and protect your FairPrice account. Verification
            reduces identity-related fraud risk — it does not guarantee listings or transactions.
          </p>

          {status?.developmentMode ? (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
              Development verification is active. Results are labeled and are not production identity
              proof.
            </div>
          ) : null}

          {status ? (
            <div className="mt-8 rounded-2xl border border-border bg-white/90 p-6 backdrop-blur">
              <p className="text-sm text-foreground-muted">Your FairPrice ID level</p>
              <p className="mt-1 font-display text-2xl font-semibold">
                Level {status.fairPriceIdLevel} · {LEVEL_LABELS[status.fairPriceIdLevel]}
              </p>
              <ul className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                <li className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" /> Email:{" "}
                  {status.flags.emailVerified ? "verified" : "pending"}
                </li>
                <li className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" /> Phone:{" "}
                  {status.flags.phoneVerified ? "verified" : "pending"}
                </li>
                <li className="flex items-center gap-2">
                  <BadgeCheck className="h-4 w-4 text-primary" /> Identity:{" "}
                  {status.flags.identityVerified ? "verified" : "pending"}
                </li>
                <li className="flex items-center gap-2">
                  <ScanFace className="h-4 w-4 text-primary" /> Face + liveness:{" "}
                  {status.flags.faceVerified && status.flags.livenessVerified
                    ? "verified"
                    : "pending"}
                </li>
              </ul>
              {status.requiresReverification ? (
                <p className="mt-3 text-sm text-amber-800">
                  Profile changes require re-verification.
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild variant="lime" size="lg">
              <Link href="/verify/identity">Verify my identity</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/verify/history">History</Link>
            </Button>
            <Button asChild variant="ghost" size="lg">
              <Link href="/settings/verification">Settings</Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense>
      <VerifyHubInner />
    </Suspense>
  );
}
