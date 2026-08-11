"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { motion } from "framer-motion";
import { BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

function Inner() {
  const params = useSearchParams();
  const id = params.get("id");
  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md rounded-2xl border border-border bg-white p-8 text-center shadow-sm"
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
          <BadgeCheck className="h-7 w-7" />
        </div>
        <h1 className="mt-4 font-display text-3xl font-bold">Identity verified</h1>
        <p className="mt-2 text-sm text-foreground-muted">
          Your FairPrice ID was updated. This confirms you completed verification — it does not
          guarantee products or transactions.
        </p>
        {id ? <p className="mt-3 text-xs text-foreground-muted">Ref {id.slice(0, 10)}…</p> : null}
        <div className="mt-6 flex flex-col gap-2">
          <Button asChild variant="lime">
            <Link href="/dashboard/verification">View trust profile</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/marketplace">Back to marketplace</Link>
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

export default function VerifySuccessPage() {
  return (
    <Suspense>
      <Inner />
    </Suspense>
  );
}
