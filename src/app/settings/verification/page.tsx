"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { SellerTrustPanel } from "@/components/verification/seller-trust-panel";

export default function SettingsVerificationPage() {
  const router = useRouter();
  const [data, setData] = React.useState<any>(null);

  React.useEffect(() => {
    (async () => {
      const res = await fetch("/api/verification");
      if (res.status === 401) {
        router.push("/login?next=/settings/verification");
        return;
      }
      const json = await res.json();
      if (json.ok) setData(json.data);
    })();
  }, [router]);

  return (
    <div className="container-page max-w-2xl py-12">
      <h1 className="font-display text-3xl font-bold">Verification</h1>
      <p className="mt-2 text-sm text-foreground-muted">
        Manage FairPrice ID status. Verification reduces identity uncertainty — it is not a fraud
        guarantee.
      </p>
      {data ? (
        <div className="mt-8 rounded-2xl border border-border bg-white p-6">
          <SellerTrustPanel
            identityVerified={data.flags.identityVerified}
            faceVerified={data.flags.faceVerified && data.flags.livenessVerified}
            phoneVerified={data.flags.phoneVerified}
            emailVerified={data.flags.emailVerified}
            trustedSeller={data.flags.trustedSeller}
          />
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild variant="lime">
              <Link href="/verify">Verify my identity</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/settings/privacy">Privacy</Link>
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
