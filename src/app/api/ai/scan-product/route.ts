import { z } from "zod";
import { ok, fail } from "@/lib/api/response";
import { handleRouteError, jsonBody } from "@/lib/api/handler";
import { callGemini, parseGeminiJson } from "@/lib/ai/gemini-fetch";
import { promises as fs } from "fs";
import path from "path";
import { env } from "@/config/env";

const schema = z.object({
  imageUrls: z.array(z.string()).min(1).max(6),
  categorySlug: z.string().optional(),
  hint: z.string().optional(),
});

// Category-specific spec fields Gemini should extract
const CATEGORY_SPEC_FIELDS: Record<string, string[]> = {
  mobiles: [
    "ram", "storage", "battery_mah", "display_inch", "processor", "os",
    "rear_camera_mp", "front_camera_mp", "color", "network", "warranty_months",
    "box_contents", "condition_detail",
  ],
  laptops: [
    "ram", "storage", "processor", "display_inch", "gpu", "os",
    "battery_wh", "color", "warranty_months", "box_contents", "condition_detail",
  ],
  tablets: [
    "ram", "storage", "display_inch", "processor", "os", "battery_mah",
    "color", "cellular", "warranty_months", "box_contents", "condition_detail",
  ],
  tvs: [
    "display_inch", "resolution", "panel_type", "smart_tv", "hdmi_ports",
    "color", "brand", "warranty_months", "condition_detail",
  ],
  cameras: [
    "megapixels", "sensor_type", "lens_included", "video_resolution",
    "color", "warranty_months", "box_contents", "condition_detail",
  ],
  headphones: [
    "type", "connectivity", "anc", "battery_hours", "color",
    "warranty_months", "box_contents", "condition_detail",
  ],
  default: [
    "color", "condition_detail", "warranty_months", "box_contents",
  ],
};

function getSpecFields(categorySlug?: string): string[] {
  if (!categorySlug) return CATEGORY_SPEC_FIELDS.default;
  for (const [key, fields] of Object.entries(CATEGORY_SPEC_FIELDS)) {
    if (categorySlug.includes(key)) return fields;
  }
  return CATEGORY_SPEC_FIELDS.default;
}

function extToMime(ext: string): string {
  const e = ext.toLowerCase().replace(".", "");
  if (e === "jpg" || e === "jpeg") return "image/jpeg";
  if (e === "png") return "image/png";
  if (e === "webp") return "image/webp";
  if (e === "gif") return "image/gif";
  return "image/jpeg";
}

async function loadImageBase64(url: string): Promise<{ data: string; mimeType: string } | null> {
  try {
    // Local /uploads/... URL — strip the public prefix and map to storage root
    if (url.startsWith("/uploads/") || url.startsWith("uploads/")) {
      // Remove the leading /uploads prefix (matches STORAGE_PUBLIC_URL=/uploads)
      const publicBase = (env.STORAGE_PUBLIC_URL ?? "/uploads").replace(/^\//, "");
      const withoutLeadingSlash = url.replace(/^\//, "");
      // subPath = everything after "uploads/" e.g. "listings/userId/file.jpg"
      const subPath = withoutLeadingSlash.startsWith(publicBase + "/")
        ? withoutLeadingSlash.slice(publicBase.length + 1)
        : path.basename(url);

      const storageRoot = path.resolve(process.cwd(), env.STORAGE_LOCAL_PATH);
      const candidates = [
        path.join(storageRoot, subPath),
        // fallback: bare filename only
        path.join(storageRoot, path.basename(url)),
      ];

      for (const candidate of candidates) {
        try {
          const buf = await fs.readFile(candidate);
          const mimeType = extToMime(path.extname(candidate));
          return { data: buf.toString("base64"), mimeType };
        } catch { /* try next */ }
      }
    }

    // Absolute http/https URL — fetch it (works for localhost /uploads/ served by Next.js)
    if (url.startsWith("http://") || url.startsWith("https://")) {
      const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
      if (!res.ok) return null;
      const contentType = res.headers.get("content-type") ?? "image/jpeg";
      const mimeType = contentType.split(";")[0]?.trim() ?? "image/jpeg";
      const buf = Buffer.from(await res.arrayBuffer());
      return { data: buf.toString("base64"), mimeType };
    }

    // Already a base64 data URL
    if (url.startsWith("data:image")) {
      const [header, data] = url.split(",");
      const mimeType = header?.match(/data:(image\/[^;]+)/)?.[1] ?? "image/jpeg";
      return data ? { data, mimeType } : null;
    }
  } catch { /* ignore */ }
  return null;
}

export async function POST(request: Request) {
  try {
    const raw = await jsonBody(request);
    if (!raw || typeof raw !== "object") {
      return fail("Request body must be JSON", 400, "INVALID_BODY");
    }

    const body = schema.parse(raw);
    const specFields = getSpecFields(body.categorySlug);

    // Load all images as base64
    const imagePayloads = (
      await Promise.all(body.imageUrls.map(loadImageBase64))
    ).filter((img): img is { data: string; mimeType: string } => img !== null);

    if (imagePayloads.length === 0) {
      return fail("Could not load any of the provided images", 400, "NO_IMAGES");
    }

    const systemPrompt = `You are FairPrice AI — an expert product identification and specification extraction engine for an Indian resale marketplace.

Your job:
1. Identify the exact product from the photos (brand, model, variant).
2. Extract every visible specification from the product, its box, label, or screen.
3. Assess the physical condition from visual inspection.
4. Return ONLY valid JSON — no markdown, no explanation.

Rules:
- Never guess premium specs when a budget device is visible.
- Use Indian market names (e.g. POCO M7, Redmi 13C, Samsung Galaxy A35).
- Set confidence 0-1 based on image clarity.
- For condition: look for scratches, cracks, screen damage, body dents, wear.
- warranty_months: 0 if no box/warranty visible, estimate remaining if box shown.
- box_contents: list what's visible (charger, earphones, cable, manual, etc.) or "Not visible".`;

    const specFieldsDesc = specFields
      .map((f) => `  "${f}": "string or null"`)
      .join(",\n");

    const userPrompt = `Analyze these product photos and return JSON in exactly this shape:

{
  "brand": "string",
  "model": "string",
  "productLabel": "string (brand + model + key variant, e.g. POCO M7 6GB/128GB)",
  "categorySlug": "mobiles|laptops|tablets|tvs|cameras|headphones|computers|other",
  "estimatedMrpInr": number or null,
  "confidence": 0.0-1.0,
  "conditionGrade": "LIKE_NEW|EXCELLENT|GOOD|FAIR|POOR",
  "conditionSummary": "one sentence describing visible condition",
  "visibleDamage": ["list of damage observed, empty array if none"],
  "specs": {
${specFieldsDesc}
  },
  "suggestedTitle": "ready-to-post listing title (max 80 chars)",
  "suggestedDescription": "2-3 sentence listing description mentioning key specs and condition",
  "insufficientQuality": boolean,
  "notes": "anything unusual or uncertain"
}
${body.hint ? `\nSeller hint: ${body.hint}` : ""}
${body.categorySlug ? `Expected category: ${body.categorySlug}` : ""}`;

    // Build message with all images inline
    const imageParts = imagePayloads.map((img) => ({
      inline_data: { mime_type: img.mimeType, data: img.data },
    }));

    // Use Gemini with automatic retry + model fallback
    let raw_response: string;
    try {
      raw_response = await callGemini({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [
          {
            role: "user",
            parts: [
              { text: userPrompt },
              ...imageParts,
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 2048,
          thinkingConfig: { thinkingBudget: 0 },
        },
      }, 60_000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Gemini unavailable";
      return fail(msg, 502, "GEMINI_ERROR");
    }

    if (!raw_response) {
      return fail("Gemini returned empty response", 502, "EMPTY_RESPONSE");
    }

    let parsed: Record<string, unknown>;
    try {
      parsed = parseGeminiJson<Record<string, unknown>>(raw_response);
    } catch {
      return fail("AI returned non-JSON response", 502, "PARSE_ERROR");
    }

    return ok({ product: parsed, imageCount: imagePayloads.length });
  } catch (error) {
    return handleRouteError(error);
  }
}
