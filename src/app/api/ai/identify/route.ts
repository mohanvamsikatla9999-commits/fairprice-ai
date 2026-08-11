import { z } from "zod";
import { promises as fs } from "fs";
import path from "path";
import { getAIService } from "@/lib/ai/service";
import { ok, fail } from "@/lib/api/response";
import { handleRouteError, jsonBody } from "@/lib/api/handler";
import { env } from "@/config/env";
import { matchCatalogProduct } from "@/services/valuation/catalog";
import { resolveProduct } from "@/services/valuation/product-resolver";

const schema = z.object({
  hint: z.string().optional(),
  categorySlug: z.string().optional(),
  imageUrls: z.array(z.string()).max(3).optional(),
});

async function loadImageBase64(url: string): Promise<string | null> {
  try {
    if (url.startsWith("/uploads/") || url.startsWith("uploads/")) {
      const rel = url.replace(/^\//, "");
      const full = path.join(process.cwd(), "storage", rel.replace(/^uploads/, "uploads"));
      // Local storage layout: STORAGE_LOCAL_PATH + filename from /uploads/...
      const fileName = path.basename(url);
      const candidates = [
        path.join(process.cwd(), env.STORAGE_LOCAL_PATH, fileName),
        path.join(process.cwd(), "storage", "uploads", fileName),
        full,
      ];
      for (const candidate of candidates) {
        try {
          const buf = await fs.readFile(candidate);
          return buf.toString("base64");
        } catch {
          // try next
        }
      }
    }
    if (url.startsWith("http://") || url.startsWith("https://")) {
      const res = await fetch(url);
      if (!res.ok) return null;
      const buf = Buffer.from(await res.arrayBuffer());
      return buf.toString("base64");
    }
    if (url.startsWith("data:image")) {
      const parts = url.split(",");
      return parts[1] ?? null;
    }
  } catch {
    return null;
  }
  return null;
}

export async function POST(request: Request) {
  try {
    const raw = await jsonBody(request);
    if (raw === null || typeof raw !== "object") {
      return fail("Request body must be JSON", 400, "INVALID_BODY");
    }
    const body = schema.parse(raw);
    const hint = body.hint?.trim();

    // Fast path: deterministic catalog match from title/hint
    const catalogHit = hint ? matchCatalogProduct(hint) : null;
    const resolved = await resolveProduct({
      productLabel: hint,
      categorySlug: body.categorySlug,
      msrpInr: catalogHit?.msrpInr,
    });

    let aiIdentity: Awaited<ReturnType<ReturnType<typeof getAIService>["identifyProduct"]>> | null =
      null;
    const imagesBase64: string[] = [];
    for (const u of body.imageUrls ?? []) {
      const b64 = await loadImageBase64(u);
      if (b64) imagesBase64.push(b64);
    }

    // Use vision/text AI when we have images or weak catalog match
    if (imagesBase64.length > 0 || !catalogHit) {
      try {
        aiIdentity = await getAIService().identifyProduct({
          hint,
          categorySlug: body.categorySlug ?? "mobiles",
          imagesBase64,
        });
      } catch {
        aiIdentity = null;
      }
    }

    // Prefer catalog/DB resolution for MSRP truth; AI helps naming from photos
    const brand = resolved?.brand ?? aiIdentity?.brand ?? catalogHit?.brand ?? "Unknown";
    const model = resolved?.model ?? aiIdentity?.model ?? catalogHit?.model ?? "Unknown";
    const productLabel =
      resolved?.productLabel ??
      aiIdentity?.productLabel ??
      (catalogHit ? `${catalogHit.brand} ${catalogHit.model}` : hint || "Unknown product");
    const msrpInr =
      resolved?.msrpInr ??
      catalogHit?.msrpInr ??
      aiIdentity?.estimatedMsrpInr ??
      null;

    const confidence = Math.max(
      resolved?.confidence ?? 0,
      catalogHit ? 0.9 : 0,
      aiIdentity?.confidence ?? 0,
    );

    if (!msrpInr && confidence < 0.45) {
      return ok({
        identified: false,
        product: null,
        message:
          "Could not confidently identify this product. Enter brand/model (e.g. POCO M7) and original price.",
        aiNotes: aiIdentity?.notes,
      });
    }

    return ok({
      identified: true,
      product: {
        brand,
        model,
        productLabel,
        categorySlug:
          resolved?.categorySlug ??
          aiIdentity?.categorySlug ??
          catalogHit?.categorySlug ??
          body.categorySlug ??
          "mobiles",
        msrpInr,
        confidence,
        source: resolved?.source ?? (catalogHit ? "builtin_catalog" : "ai"),
        storage: aiIdentity?.storage ?? null,
        color: aiIdentity?.color ?? null,
        notes:
          aiIdentity?.notes ??
          (catalogHit
            ? `Matched ${catalogHit.brand} ${catalogHit.model} in FairPrice catalog (MRP ₹${catalogHit.msrpInr.toLocaleString("en-IN")}).`
            : undefined),
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
