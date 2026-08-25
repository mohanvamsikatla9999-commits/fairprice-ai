"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldCheck, AlertTriangle, Trash2, Eye, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export default function SettingsPrivacyPage() {
  const router = useRouter();
  const [status, setStatus] = React.useState<Record<string, unknown> | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);
  const [messageType, setMessageType] = React.useState<"success" | "error">("success");

  // Account deletion modal state
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  const [deleteConfirm, setDeleteConfirm] = React.useState("");
  const [deletePassword, setDeletePassword] = React.useState("");
  const [deleteLoading, setDeleteLoading] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);
  const [hasPassword, setHasPassword] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      const [verRes, meRes] = await Promise.all([
        fetch("/api/verification"),
        fetch("/api/auth/me"),
      ]);
      if (verRes.status === 401) {
        router.push("/login?next=/settings/privacy");
        return;
      }
      const verJson = await verRes.json();
      const meJson = await meRes.json();
      if (verJson.ok) setStatus(verJson.data);
      if (meJson.ok) {
        setHasPassword(Boolean(meJson.data.user?.passwordHash !== null));
      }
    })();
  }, [router]);

  async function requestDeletion() {
    const res = await fetch("/api/verification/deletion-request", { method: "POST" });
    const json = await res.json();
    setMessage(
      json.ok
        ? "Deletion request recorded. Our team will process it within 30 days per DPDP Act 2023."
        : json.error?.message,
    );
    setMessageType(json.ok ? "success" : "error");
  }

  async function deleteAccount() {
    if (deleteConfirm !== "DELETE MY ACCOUNT") {
      setDeleteError("Please type exactly: DELETE MY ACCOUNT");
      return;
    }
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      const res = await fetch("/api/auth/delete-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          confirmation: "DELETE MY ACCOUNT",
          ...(hasPassword && deletePassword ? { password: deletePassword } : {}),
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setDeleteError(json.error?.message ?? "Deletion failed. Please try again.");
        return;
      }
      // Account deleted — redirect to homepage
      window.location.href = "/?deleted=1";
    } catch {
      setDeleteError("Network error. Please try again.");
    } finally {
      setDeleteLoading(false);
    }
  }

  const idLevel = String(status?.fairPriceIdLevel ?? "—");

  return (
    <div className="container-page max-w-2xl py-12">
      <h1 className="font-display text-3xl font-bold">Privacy settings</h1>
      <p className="mt-2 text-sm text-foreground-muted">
        Manage your FairPrice ID, biometric consent, and personal data.
      </p>

      {/* Verification status */}
      <div className="mt-8 rounded-2xl border border-border bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
            <ShieldCheck className="h-5 w-5 text-primary" />
          </div>
          <h2 className="font-semibold">FairPrice ID</h2>
        </div>
        <div className="space-y-2 text-sm text-foreground-muted">
          <p><span className="font-medium text-foreground">Verification level:</span> {idLevel}</p>
          <p>Biometric face images are processed in memory and immediately discarded — never stored.</p>
          <p>We retain only: verification outcome, timestamp, risk classification, and consent record.</p>
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button asChild variant="outline" size="sm">
            <Link href="/verify/history">
              <Eye className="h-4 w-4" />
              Consent &amp; history
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/verify">Update verification</Link>
          </Button>
        </div>
      </div>

      {/* Legal */}
      <div className="mt-5 rounded-2xl border border-border bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100">
            <FileText className="h-5 w-5 text-blue-600" />
          </div>
          <h2 className="font-semibold">Legal documents</h2>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="outline" size="sm"><Link href="/privacy">Privacy policy</Link></Button>
          <Button asChild variant="outline" size="sm"><Link href="/terms">Terms of service</Link></Button>
        </div>
      </div>

      {/* Data requests */}
      <div className="mt-5 rounded-2xl border border-border bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100">
            <Eye className="h-5 w-5 text-amber-600" />
          </div>
          <h2 className="font-semibold">Your data rights (DPDP Act 2023)</h2>
        </div>
        <p className="text-sm text-foreground-muted mb-4">
          Under India&apos;s Digital Personal Data Protection Act, you may request access to, correction of,
          or deletion of your personal data.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" size="sm" onClick={requestDeletion}>
            Request verification data deletion
          </Button>
          <Button asChild variant="ghost" size="sm">
            <a href="mailto:privacy@fairprice.ai">Contact privacy team</a>
          </Button>
        </div>
        {message && (
          <p className={cn("mt-3 rounded-xl border px-4 py-2.5 text-sm", messageType === "success" ? "border-green-200 bg-green-50 text-green-800" : "border-red-200 bg-red-50 text-red-700")}>
            {message}
          </p>
        )}
      </div>

      {/* Account deletion */}
      <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-100">
            <Trash2 className="h-5 w-5 text-red-600" />
          </div>
          <h2 className="font-semibold text-red-800">Delete account</h2>
        </div>
        <p className="text-sm text-red-700 mb-4">
          Permanently delete your account, anonymise all personal data, remove all active listings,
          and revoke all sessions. This cannot be undone. Some audit records may be retained as
          required by law.
        </p>
        <Button variant="outline" size="sm" className="border-red-300 text-red-700 hover:bg-red-100" onClick={() => setShowDeleteModal(true)}>
          Delete my account
        </Button>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-white p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600 shrink-0" />
              <h3 className="font-display text-xl font-bold text-red-800">Delete account</h3>
            </div>
            <p className="text-sm text-foreground-muted mb-5">
              This will permanently delete your account, anonymise all personal data, and remove all active listings.
              <strong className="block mt-2 text-foreground"> This cannot be undone.</strong>
            </p>

            <div className="space-y-4">
              {hasPassword && (
                <div>
                  <Label htmlFor="del-pwd">Your password</Label>
                  <Input
                    id="del-pwd"
                    type="password"
                    className="mt-1.5"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    placeholder="Enter your password to confirm"
                  />
                </div>
              )}
              <div>
                <Label htmlFor="del-confirm">
                  Type <strong>DELETE MY ACCOUNT</strong> to confirm
                </Label>
                <Input
                  id="del-confirm"
                  className="mt-1.5"
                  value={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value)}
                  placeholder="DELETE MY ACCOUNT"
                />
              </div>
            </div>

            {deleteError && (
              <p className="mt-3 text-sm text-red-600">{deleteError}</p>
            )}

            <div className="mt-5 flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => { setShowDeleteModal(false); setDeleteConfirm(""); setDeletePassword(""); setDeleteError(null); }}
                disabled={deleteLoading}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                onClick={() => void deleteAccount()}
                disabled={deleteLoading || deleteConfirm !== "DELETE MY ACCOUNT"}
              >
                {deleteLoading ? "Deleting…" : "Permanently delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
