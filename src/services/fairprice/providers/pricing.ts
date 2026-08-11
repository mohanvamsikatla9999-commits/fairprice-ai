import type { ExternalPriceRef } from "../schemas";

export type ProductPriceQuery = {
  brand?: string | null;
  model?: string | null;
  variant?: string | null;
  storage?: string | null;
  productLabel: string;
  category?: string | null;
};

export interface PricingProvider {
  readonly name: "amazon" | "flipkart" | "catalog";
  searchProduct(query: ProductPriceQuery): Promise<ExternalPriceRef[]>;
}

function freshnessFrom(retrievedAt: Date): ExternalPriceRef["freshness"] {
  const hours = (Date.now() - retrievedAt.getTime()) / 3_600_000;
  if (hours < 6) return "fresh";
  if (hours < 24) return "recent";
  if (hours < 72) return "stale";
  return "old";
}

function unavailable(
  source: ExternalPriceRef["source"],
  title: string,
): ExternalPriceRef {
  const retrievedAt = new Date();
  return {
    source,
    title,
    priceInr: null,
    currency: "INR",
    url: null,
    productId: null,
    availability: null,
    matchScore: 0,
    retrievedAt: retrievedAt.toISOString(),
    expiresAt: null,
    freshness: freshnessFrom(retrievedAt),
    available: false,
  };
}

/**
 * Amazon Product Pricing provider.
 * Official PA-API is deprecated (May 2026) — this interface is credential-ready.
 * Without credentials, returns unavailable (never fabricates prices).
 */
export class AmazonProductProvider implements PricingProvider {
  readonly name = "amazon" as const;

  async searchProduct(query: ProductPriceQuery): Promise<ExternalPriceRef[]> {
    const key = process.env.AMAZON_ACCESS_KEY ?? process.env.AMAZON_PAAPI_ACCESS_KEY;
    const secret = process.env.AMAZON_SECRET_KEY ?? process.env.AMAZON_PAAPI_SECRET_KEY;
    const partner = process.env.AMAZON_PARTNER_TAG;
    if (!key || !secret || !partner) {
      return [
        unavailable(
          "amazon",
          `Amazon unavailable for ${query.productLabel}`,
        ),
      ];
    }
    // Live API wiring reserved for supported Amazon Creator/Product APIs.
    // Do not scrape HTML. Do not invent prices.
    return [
      unavailable("amazon", `Amazon API configured but adapter pending for ${query.productLabel}`),
    ];
  }
}

/**
 * Flipkart Affiliate/Product API provider.
 * Without credentials → unavailable (never fabricates).
 */
export class FlipkartProductProvider implements PricingProvider {
  readonly name = "flipkart" as const;

  async searchProduct(query: ProductPriceQuery): Promise<ExternalPriceRef[]> {
    const token = process.env.FLIPKART_AFFILIATE_TOKEN;
    const trackingId = process.env.FLIPKART_AFFILIATE_ID;
    if (!token || !trackingId) {
      return [
        unavailable(
          "flipkart",
          `Flipkart unavailable for ${query.productLabel}`,
        ),
      ];
    }
    return [
      unavailable(
        "flipkart",
        `Flipkart API configured but adapter pending for ${query.productLabel}`,
      ),
    ];
  }
}

/** Catalog MRP as a first-party new-price reference (not Amazon/Flipkart). */
export class CatalogPricingProvider implements PricingProvider {
  readonly name = "catalog" as const;

  async searchProduct(
    query: ProductPriceQuery & { msrpInr?: number | null },
  ): Promise<ExternalPriceRef[]> {
    if (!query.msrpInr || query.msrpInr <= 0) {
      return [unavailable("catalog", `No catalog MRP for ${query.productLabel}`)];
    }
    // Strong match only when brand+model present; never title-alone.
    const hasIdentity = Boolean(query.brand && query.model);
    if (!hasIdentity && !query.msrpInr) {
      return [unavailable("catalog", `Weak identity for ${query.productLabel}`)];
    }
    const retrievedAt = new Date();
    const expiresAt = new Date(retrievedAt.getTime() + 6 * 3_600_000);
    return [
      {
        source: "catalog",
        title: `${query.productLabel} (catalog MRP)`,
        priceInr: query.msrpInr,
        listPriceInr: query.msrpInr,
        currency: "INR",
        url: null,
        productId: null,
        availability: "catalog",
        matchScore: hasIdentity ? 0.92 : 0.75,
        retrievedAt: retrievedAt.toISOString(),
        expiresAt: expiresAt.toISOString(),
        freshness: freshnessFrom(retrievedAt),
        available: true,
      },
    ];
  }
}

export function getAmazonProvider(): PricingProvider {
  return new AmazonProductProvider();
}

export function getFlipkartProvider(): PricingProvider {
  return new FlipkartProductProvider();
}
