"use client";

import { VerificationBadge } from "@/components/verification/verification-badge";
import { Star } from "lucide-react";

export type SellerTrustProps = {
  identityVerified?: boolean;
  faceVerified?: boolean;
  phoneVerified?: boolean;
  emailVerified?: boolean;
  trustedSeller?: boolean;
  completedTransactions?: number;
  rating?: number;
  reviewCount?: number;
  accountAgeLabel?: string;
  caution?: boolean;
  className?: string;
};

export function SellerTrustPanel({
  identityVerified,
  faceVerified,
  phoneVerified,
  emailVerified,
  trustedSeller,
  completedTransactions = 0,
  rating,
  reviewCount = 0,
  accountAgeLabel,
  caution,
  className,
}: SellerTrustProps) {
  return (
    <div className={className}>
      <h3 className="font-display text-lg font-semibold tracking-tight">Seller trust</h3>
      <p className="mt-1 text-sm text-foreground-muted">
        Identity signals for this account — not a guarantee of the item or deal.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {trustedSeller ? <VerificationBadge kind="trusted" /> : null}
        {identityVerified ? <VerificationBadge kind="identity" /> : null}
        {faceVerified ? <VerificationBadge kind="face" /> : null}
        {phoneVerified ? <VerificationBadge kind="phone" /> : null}
        {emailVerified ? <VerificationBadge kind="email" /> : null}
        {!identityVerified && !faceVerified && !phoneVerified && !emailVerified ? (
          <span className="text-sm text-foreground-muted">Not yet identity-verified</span>
        ) : null}
      </div>

      <ul className="mt-4 space-y-1.5 text-sm text-foreground-muted">
        {completedTransactions > 0 ? (
          <li>✓ {completedTransactions} completed transactions</li>
        ) : (
          <li>No completed transactions yet</li>
        )}
        {typeof rating === "number" && rating > 0 ? (
          <li className="inline-flex items-center gap-1">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            {rating.toFixed(1)} seller rating
            {reviewCount ? ` (${reviewCount})` : ""}
          </li>
        ) : null}
        {accountAgeLabel ? <li>Account age: {accountAgeLabel}</li> : null}
      </ul>

      {caution ? (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <p className="font-medium">Use extra caution</p>
          <p className="mt-1 text-amber-900/80">
            This listing shows elevated risk signals. Check FairPrice, review seller trust, and follow
            safe transaction practices.
          </p>
        </div>
      ) : null}

      <p className="mt-4 text-xs leading-relaxed text-foreground-muted">
        FairPrice AI cannot guarantee the condition or authenticity of an item. Always inspect the
        product and follow safe transaction practices.
      </p>
    </div>
  );
}
