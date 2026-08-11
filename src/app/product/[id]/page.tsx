"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { Heart, MessageSquare, ShieldAlert, Sparkles } from "lucide-react";
import { ProductGallery } from "@/components/marketplace/product-gallery";
import { SellerCard } from "@/components/trust/seller-card";
import { SellerTrustPanel } from "@/components/verification/seller-trust-panel";
import { PriceMeter } from "@/components/valuation/price-meter";
import { FairValueCard } from "@/components/valuation/fair-value-card";
import { ValuationReport } from "@/components/valuation/valuation-report";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { ErrorState } from "@/components/shared/error-state";
import { formatInr } from "@/lib/utils";
import { ReportModal } from "@/components/trust/report-modal";

type Valuation = {
  fairValueMinInr: number;
  fairValueMaxInr: number;
  fairValueMidInr: number;
  recommendedListingInr: number;
  expectedSaleMinInr: number;
  expectedSaleMaxInr: number;
  quickSaleInr: number;
  priceConfidence: number;
  marketDemandScore: number;
  conditionScore: number;
  verdict: "UNDERPRICED" | "FAIR" | "SLIGHTLY_HIGH" | "OVERPRICED" | "UNKNOWN";
  negotiationMinInr: number;
  negotiationMaxInr: number;
  explanation?: string;
  buyerVerdict?: string;
  sellerRecommendation?: string;
};

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [listing, setListing] = React.useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [valuation, setValuation] = React.useState<Valuation | null>(null);
  const [checking, setChecking] = React.useState(false);
  const [favorited, setFavorited] = React.useState(false);
  const [offerAmount, setOfferAmount] = React.useState("");
  const [offerMessage, setOfferMessage] = React.useState("");
  const [offerStatus, setOfferStatus] = React.useState<string | null>(null);
  const [reportOpen, setReportOpen] = React.useState(false);
  const [similar, setSimilar] = React.useState<
    Array<{ id: string; title: string; priceInr: number; imageUrl: string | null }>
  >([]);

  React.useEffect(() => {
    (async () => {
      setLoading(true);
      const res = await fetch(`/api/listings/${id}`);
      const json = await res.json();
      if (!json.ok) {
        setError(json.error?.message ?? "Listing not found");
        setLoading(false);
        return;
      }
      setListing(json.data.listing);
      setOfferAmount(String(json.data.listing.priceInr));
      try {
        const fav = await fetch(`/api/listings/${id}/favorite`);
        if (fav.ok) {
          const fJson = await fav.json();
          if (fJson.ok) setFavorited(fJson.data.favorited);
        }
      } catch {
        /* ignore */
      }
      const valRes = await fetch(`/api/listings/${id}/valuation`);
      const valJson = await valRes.json();
      if (valJson.ok && valJson.data.valuation) {
        setValuation(valJson.data.valuation as Valuation);
      }
      try {
        const sim = await fetch(`/api/listings/${id}/similar`);
        const simJson = await sim.json();
        if (simJson.ok) setSimilar(simJson.data.items ?? []);
      } catch {
        /* ignore */
      }
      void fetch("/api/recently-viewed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: id }),
      }).catch(() => undefined);
      setLoading(false);
    })();
  }, [id]);

  async function checkFairPrice() {
    setChecking(true);
    setError(null);
    try {
      const res = await fetch(`/api/listings/${id}/valuation`, { method: "POST" });
      const json = await res.json();
      if (!json.ok) {
        setError(json.error?.message ?? "Valuation failed");
        return;
      }
      setValuation(json.data.valuation);
      // Scroll valuation into view on smaller screens after Check FairPrice
      requestAnimationFrame(() => {
        document
          .getElementById("fairprice-report")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    } catch {
      setError("Network error while checking FairPrice");
    } finally {
      setChecking(false);
    }
  }

  async function toggleFavorite() {
    const res = await fetch(`/api/listings/${id}/favorite`, { method: "POST" });
    const json = await res.json();
    if (json.ok) setFavorited(json.data.favorited);
    else if (res.status === 401) router.push("/login");
  }

  async function startChat() {
    const res = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId: id }),
    });
    const json = await res.json();
    if (res.status === 401) {
      router.push("/login");
      return;
    }
    if (json.ok) router.push(`/messages/${json.data.conversation.id}`);
  }

  async function submitOffer() {
    setOfferStatus(null);
    const res = await fetch("/api/offers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        listingId: id,
        amountInr: Number(offerAmount),
        message: offerMessage || undefined,
      }),
    });
    const json = await res.json();
    if (res.status === 401) {
      router.push("/login");
      return;
    }
    if (!json.ok) {
      setOfferStatus(json.error?.message ?? "Offer failed");
      return;
    }
    setOfferStatus("Offer sent to seller");
  }

  async function submitReport(payload: { reason: string; details: string }) {
    await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        targetType: "LISTING",
        listingId: id,
        reason: payload.reason,
        details: payload.details,
      }),
    });
    setReportOpen(false);
  }

  if (loading) {
    return (
      <div className="container-page py-10">
        <LoadingSkeleton variant="detail" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="container-page py-16">
        <ErrorState title="Listing unavailable" message={error ?? undefined} />
      </div>
    );
  }

  const images = (listing.images as Array<{ url: string }> | undefined) ?? [];
  const category = listing.category as { name?: string } | undefined;
  const seller = listing.seller as
    | {
        id: string;
        name?: string | null;
        displayName?: string | null;
        avatarUrl?: string | null;
        trustScore?: number;
        sellerTrustScore?: number;
        verificationLevel?: string;
        emailVerified?: string | Date | null;
        phoneVerified?: string | Date | null;
        identityVerifiedAt?: string | Date | null;
        faceVerifiedAt?: string | Date | null;
        livenessVerifiedAt?: string | Date | null;
        createdAt?: string | Date;
        profile?: { completedSales?: number } | null;
        reviewsReceived?: Array<{ rating: number }>;
      }
    | undefined;
  const priceInr = listing.priceInr as number;
  const title = listing.title as string;
  const sellerRatings = seller?.reviewsReceived ?? [];
  const sellerRatingAvg =
    sellerRatings.length > 0
      ? sellerRatings.reduce((s, r) => s + r.rating, 0) / sellerRatings.length
      : undefined;
  const underpriced =
    valuation &&
    valuation.fairValueMidInr > 0 &&
    priceInr < valuation.fairValueMidInr * 0.55;
  const sellerUnverified = !seller?.identityVerifiedAt && !seller?.faceVerifiedAt;
  const showCaution = Boolean(underpriced && sellerUnverified);
  const demand =
    (valuation?.marketDemandScore ?? 0.55) > 0.7
      ? "high"
      : (valuation?.marketDemandScore ?? 0.55) < 0.4
        ? "low"
        : "moderate";

  return (
    <div className="container-page py-8 md:py-12">
      <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <ProductGallery images={images.map((img) => img.url)} alt={title} />
          <div className="rounded-2xl border border-border bg-white p-6">
            <h2 className="font-display text-xl font-semibold">Description</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground-muted">
              {String(listing.description ?? "")}
            </p>
          </div>
          {valuation ? (
            <div id="fairprice-report" className="scroll-mt-24 space-y-4">
            <ValuationReport
              productName={title}
              sellerPrice={priceInr}
              fairLow={valuation.fairValueMinInr}
              fairHigh={valuation.fairValueMaxInr}
              recommendedListing={valuation.recommendedListingInr}
              expectedSelling={valuation.expectedSaleMaxInr}
              quickSale={valuation.quickSaleInr}
              confidence={Math.round(valuation.priceConfidence * 100)}
              demand={demand}
              conditionScore={valuation.conditionScore}
              zone={
                valuation.verdict === "UNKNOWN" ? undefined : valuation.verdict
              }
              insights={[
                ...(valuation.explanation
                  ? [
                      {
                        title: "AI explanation",
                        body: valuation.explanation,
                      },
                    ]
                  : []),
                ...(valuation.buyerVerdict
                  ? [{ title: "Buyer take", body: valuation.buyerVerdict }]
                  : []),
                ...(valuation.sellerRecommendation
                  ? [
                      {
                        title: "Seller tip",
                        body: valuation.sellerRecommendation,
                      },
                    ]
                  : []),
              ]}
            />
            </div>
          ) : null}
        </div>

        <div className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
            <div className="mb-3 flex flex-wrap gap-2">
              {category?.name ? <Badge variant="soft">{category.name}</Badge> : null}
              <Badge>
                {String(listing.conditionGrade ?? "GOOD").replaceAll("_", " ")}
              </Badge>
            </div>
            <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
              {title}
            </h1>
            <p className="mt-3 font-display text-3xl font-bold text-primary">
              {formatInr(priceInr)}
            </p>
            <p className="mt-1 text-sm text-foreground-muted">
              {[listing.city, listing.state].filter(Boolean).join(", ") || "India"}
            </p>

            <div className="mt-6 space-y-3">
              <Button
                variant="lime"
                size="lg"
                className="w-full shadow-[0_12px_32px_rgba(184,255,60,0.35)]"
                disabled={checking}
                onClick={() => void checkFairPrice()}
              >
                <Sparkles className="h-4 w-4" />
                {checking ? "Checking FairPrice…" : "Check FairPrice"}
              </Button>
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" onClick={() => void startChat()}>
                  <MessageSquare className="h-4 w-4" />
                  Chat
                </Button>
                <Button variant="outline" onClick={() => void toggleFavorite()}>
                  <Heart
                    className={`h-4 w-4 ${favorited ? "fill-primary text-primary" : ""}`}
                  />
                  {favorited ? "Saved" : "Save"}
                </Button>
              </div>
              <Button
                variant="ghost"
                className="w-full text-destructive"
                onClick={() => setReportOpen(true)}
              >
                <ShieldAlert className="h-4 w-4" />
                Report listing
              </Button>
            </div>
          </div>

          {valuation ? (
            <>
              <PriceMeter
                sellerPrice={priceInr}
                fairLow={valuation.fairValueMinInr}
                fairHigh={valuation.fairValueMaxInr}
                negotiationLow={valuation.negotiationMinInr}
                negotiationHigh={valuation.negotiationMaxInr}
                zone={
                  valuation.verdict === "UNKNOWN" ? undefined : valuation.verdict
                }
              />
              <FairValueCard
                fairLow={valuation.fairValueMinInr}
                fairHigh={valuation.fairValueMaxInr}
                recommendedListing={valuation.recommendedListingInr}
                expectedSelling={valuation.expectedSaleMaxInr}
                quickSale={valuation.quickSaleInr}
                confidence={Math.round(valuation.priceConfidence * 100)}
                demand={demand}
              />
            </>
          ) : null}

          <SellerCard
            id={seller?.id ?? "seller"}
            name={seller?.displayName || seller?.name || "Seller"}
            imageUrl={seller?.avatarUrl ?? undefined}
            trustScore={seller?.sellerTrustScore ?? seller?.trustScore}
            location={[listing.city, listing.state].filter(Boolean).join(", ")}
            trustLevel={
              seller?.faceVerifiedAt || seller?.identityVerifiedAt
                ? "verified"
                : sellerUnverified
                  ? "caution"
                  : "new"
            }
          />

          <div className="rounded-2xl border border-border bg-white p-6">
            <SellerTrustPanel
              identityVerified={Boolean(seller?.identityVerifiedAt)}
              faceVerified={Boolean(
                seller?.faceVerifiedAt && seller?.livenessVerifiedAt,
              )}
              phoneVerified={Boolean(seller?.phoneVerified)}
              emailVerified={Boolean(seller?.emailVerified)}
              trustedSeller={
                seller?.verificationLevel === "TRUSTED_SELLER" ||
                seller?.verificationLevel === "BUSINESS_VERIFIED"
              }
              completedTransactions={seller?.profile?.completedSales ?? 0}
              rating={sellerRatingAvg}
              reviewCount={sellerRatings.length}
              caution={showCaution}
            />
            {seller?.id ? (
              <a
                href={`/seller/${seller.id}`}
                className="mt-4 inline-block text-sm text-primary hover:underline"
              >
                View seller store
              </a>
            ) : null}
          </div>

          {priceInr >= 50000 ? (
            <div className="rounded-2xl border border-border bg-white p-6">
              <h3 className="font-display text-lg font-semibold">FairPrice Assist</h3>
              <p className="mt-1 text-sm text-foreground-muted">
                Optional mock escrow for high-value deals — inspect before release.
              </p>
              <Button
                className="mt-4 w-full"
                variant="outline"
                onClick={async () => {
                  const res = await fetch("/api/assist", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ listingId: id }),
                  });
                  const json = await res.json();
                  setOfferStatus(
                    json.ok
                      ? `Assist started · fee ${json.data.feeInr} · ${json.data.steps?.[0]}`
                      : json.error?.message,
                  );
                }}
              >
                Start Assist
              </Button>
            </div>
          ) : null}

          <div className="rounded-2xl border border-border bg-white p-6">
            <h3 className="font-display text-lg font-semibold">Make an offer</h3>
            <div className="mt-4 space-y-3">
              <Input
                type="number"
                value={offerAmount}
                onChange={(e) => setOfferAmount(e.target.value)}
                placeholder="Offer amount (INR)"
              />
              <Textarea
                value={offerMessage}
                onChange={(e) => setOfferMessage(e.target.value)}
                placeholder="Optional message"
                rows={3}
              />
              <Button className="w-full" onClick={() => void submitOffer()}>
                Send offer
              </Button>
              {offerStatus ? (
                <p className="text-sm text-foreground-muted">{offerStatus}</p>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <ReportModal
        open={reportOpen}
        onOpenChange={setReportOpen}
        listingTitle={title}
        onSubmit={(payload) => void submitReport(payload)}
      />

      {similar.length > 0 ? (
        <div className="mt-12">
          <h2 className="font-display text-2xl font-semibold">Similar items</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {similar.map((s) => (
              <a
                key={s.id}
                href={`/product/${s.id}`}
                className="rounded-2xl border border-border bg-white p-3 hover:border-primary/40"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={s.imageUrl ?? "/placeholder-listing.svg"}
                  alt=""
                  className="aspect-[4/3] w-full rounded-xl object-cover"
                />
                <p className="mt-2 line-clamp-2 text-sm font-medium">{s.title}</p>
                <p className="text-sm text-primary">{formatInr(s.priceInr)}</p>
              </a>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
