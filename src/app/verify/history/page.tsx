"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldCheck, Clock, CheckCircle2, XCircle, AlertCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

type VerificationRecord = {
  id: string;
  status: string;
  provider: string;
  method: string;
  riskClass: string;
  isDevelopment: boolean;
  createdAt: string;
  completedAt: string | null;
};

type ConsentRecord = {
  id: string;
  version: string;
  consentedAt: string;
  withdrawnAt: string | null;
  biometricProcessing: boolean;
};

export default function VerifyHistoryPage() {
  const router = useRouter();
  const [verifications, setVerifications] = React.useState<VerificationRecord[]>([]);
  const [consents, setConsents] = React.useState<ConsentRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [withdrawMsg, setWithdrawMsg] = React.useState<string | null>(null);

  React.useEffect(() => {
    (async () => {
      const res = await fetch("/api/verification/history");
      if (res.status === 401) { router.push("/login?next=/verify/history"); return; }
      const json = await res.json();
      if (json.ok) {
        setVerifications(json.data.verifications ?? []);
        setConsents(json.data.consents ?? []);
      }
      setLoading(false);
    })();
  }, [router]);

  async function withdrawConsent(id: string) {
    const res = await fetch(`/api/verification/consent/${id}/withdraw`, { method: "POST" });
    const json = await res.json();
    setWithdrawMsg(json.ok ? "Consent withdrawn. Future biometric processing will be blocked." : json.error?.message);
    if (json.ok) setConsents((prev) => prev.map((c) => c.id === id ? { ...c, withdrawnAt: new Date().toISOString() } : c));
  }

  const STATUS_ICON: Record<string, React.ReactNode> = {
    VERIFIED: <CheckCircle2 className="h-4 w-4 text-green-600" />,
    FAILED: <XCircle className="h-4 w-4 text-red-500" />,
    IN_PROGRESS: <Clock className="h-4 w-4 text-amber-500" />,
    REVIEW_REQUIRED: <AlertCircle className="h-4 w-4 text-amber-500" />,
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f4f7ff] to-white">
      <div className="hero-blue">
        <div className="container-page max-w-3xl py-10 text-white">
          <Button asChild variant="ghost" size="sm" className="mb-4 text-white/70 hover:text-white hover:bg-white/10">
            <Link href="/settings/privacy"><ArrowLeft className="h-4 w-4" /> Privacy settings</Link>
          </Button>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold">Consent &amp; Verification History</h1>
              <p className="text-sm text-white/75">Your FairPrice ID activity and biometric consent records</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container-page max-w-3xl py-8 space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : (
          <>
            {/* Consent records */}
            <div className="rounded-2xl border border-border bg-white shadow-sm">
              <div className="border-b border-border px-6 py-4">
                <h2 className="font-display font-semibold">Biometric consent history</h2>
                <p className="mt-0.5 text-xs text-foreground-muted">Records of when you consented to biometric processing</p>
              </div>
              {consents.length === 0 ? (
                <p className="px-6 py-8 text-sm text-foreground-muted">No consent records found.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {consents.map((c) => (
                    <li key={c.id} className="flex items-center justify-between gap-4 px-6 py-4">
                      <div>
                        <p className="text-sm font-medium">Consent v{c.version}</p>
                        <p className="text-xs text-foreground-muted">
                          Consented {new Date(c.consentedAt).toLocaleDateString("en-IN")}
                          {c.withdrawnAt ? ` · Withdrawn ${new Date(c.withdrawnAt).toLocaleDateString("en-IN")}` : ""}
                        </p>
                        <p className="text-xs text-foreground-muted">
                          Biometric processing: {c.biometricProcessing ? "Allowed" : "Blocked"}
                        </p>
                      </div>
                      {!c.withdrawnAt && (
                        <Button size="sm" variant="outline" onClick={() => void withdrawConsent(c.id)}>
                          Withdraw
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Verification records */}
            <div className="rounded-2xl border border-border bg-white shadow-sm">
              <div className="border-b border-border px-6 py-4">
                <h2 className="font-display font-semibold">Verification attempts</h2>
                <p className="mt-0.5 text-xs text-foreground-muted">History of identity verification sessions</p>
              </div>
              {verifications.length === 0 ? (
                <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
                  <ShieldCheck className="h-10 w-10 text-border" />
                  <p className="text-sm text-foreground-muted">No verification sessions yet.</p>
                  <Button asChild variant="lime" size="sm">
                    <Link href="/verify">Start verification</Link>
                  </Button>
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {verifications.map((v) => (
                    <li key={v.id} className="flex items-start gap-3 px-6 py-4">
                      <div className="mt-0.5 shrink-0">
                        {STATUS_ICON[v.status] ?? <Clock className="h-4 w-4 text-foreground-muted" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium capitalize">{v.status.replace(/_/g, " ").toLowerCase()}</p>
                        <p className="text-xs text-foreground-muted">
                          {v.method.replace(/_/g, " ")} · {v.provider}
                          {v.isDevelopment ? " (dev)" : ""}
                          {" · "}Risk: {v.riskClass}
                        </p>
                        <p className="text-xs text-foreground-muted">
                          Started {new Date(v.createdAt).toLocaleString("en-IN")}
                          {v.completedAt ? ` · Completed ${new Date(v.completedAt).toLocaleString("en-IN")}` : ""}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {withdrawMsg && (
              <p className="rounded-xl border border-border bg-white px-4 py-3 text-sm text-foreground-muted">{withdrawMsg}</p>
            )}

            <div className="flex flex-wrap gap-3">
              <Button asChild variant="outline"><Link href="/settings/privacy">Back to Privacy</Link></Button>
              <Button asChild variant="ghost"><Link href="/verify">Update verification</Link></Button>
            </div>

            <p className="text-xs text-foreground-muted">
              Biometric captures are discarded immediately after analysis. Only verification status, timestamps, and risk classification are retained per our privacy policy.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
