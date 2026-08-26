/**
 * Gemini-powered face verification endpoint.
 * Accepts a base64 selfie image and uses Gemini vision to verify:
 * - Is there a real human face present?
 * - Is it a live person (not a photo of a photo / screen)?
 * - Is the face clearly visible?
 *
 * Does NOT store the image. The base64 is used only for the Gemini API call
 * and discarded immediately after.
 */
import { z } from "zod";
import { requireUser } from "@/lib/auth/middleware";
import { markSigninFaceVerified } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { ok, fail } from "@/lib/api/response";
import { handleRouteError, jsonBody } from "@/lib/api/handler";
import { callGemini, parseGeminiJson } from "@/lib/ai/gemini-fetch";

const schema = z.object({
  imageBase64: z.string().min(100), // base64 encoded image
  mimeType: z.string().default("image/jpeg"),
  sessionId: z.string().optional(),
});

type GeminiFaceResult = {
  hasFace: boolean;
  isLivePerson: boolean;
  faceQuality: "good" | "partial" | "poor" | "none";
  confidence: number;
  reason: string;
  spoofDetected: boolean;
};

export async function POST(request: Request) {
  try {
    const user = await requireUser({ allowPendingFace: true });
    const raw = await jsonBody(request);
    if (!raw || typeof raw !== "object") {
      return fail("Request body must be JSON", 400, "INVALID_BODY");
    }

    const body = schema.parse(raw);

    // Strip data URL prefix if present
    const imageData = body.imageBase64.includes(",")
      ? body.imageBase64.split(",")[1]!
      : body.imageBase64;

    const systemPrompt = `You are a face verification system for FairPrice AI, an Indian marketplace.
Your job is to analyze a selfie image and determine if it shows a real live human face.

Return ONLY valid JSON — no markdown, no explanation.

Check for:
1. Is there a human face in the image?
2. Is it a real live person (not a photo of a photo, not a screen, not a printout)?
3. Is the face clear enough for identity verification?
4. Any spoof attempts (holding up a phone screen, printed photo, mask)?`;

    const userPrompt = `Analyze this selfie image and return JSON:
{
  "hasFace": boolean,
  "isLivePerson": boolean,
  "faceQuality": "good" | "partial" | "poor" | "none",
  "confidence": 0.0-1.0,
  "reason": "brief explanation",
  "spoofDetected": boolean
}

Be strict — reject photos of photos, screens showing faces, and blurry/obscured faces.`;

    let geminiResult: GeminiFaceResult;
    try {
      const rawText = await callGemini({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [
          {
            role: "user",
            parts: [
              { text: userPrompt },
              { inline_data: { mime_type: body.mimeType, data: imageData } },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 256,
          thinkingConfig: { thinkingBudget: 0 },
        },
      }, 30_000);

      geminiResult = parseGeminiJson<GeminiFaceResult>(rawText);
    } catch {
      // Gemini unavailable — in development, allow through
      if (process.env.NODE_ENV !== "production") {
        geminiResult = {
          hasFace: true,
          isLivePerson: true,
          faceQuality: "good",
          confidence: 0.9,
          reason: "Dev mode — Gemini unavailable, auto-approved",
          spoofDetected: false,
        };
      } else {
        return fail("Face verification service temporarily unavailable. Please try again.", 503, "GEMINI_UNAVAILABLE");
      }
    }

    // Determine if verification passes
    const passed =
      geminiResult.hasFace &&
      geminiResult.isLivePerson &&
      !geminiResult.spoofDetected &&
      (geminiResult.faceQuality === "good" || geminiResult.faceQuality === "partial") &&
      geminiResult.confidence >= 0.6;

    if (!passed) {
      // Record failed attempt
      await prisma.verificationAttempt.create({
        data: {
          verificationId: body.sessionId ?? "gemini-direct",
          userId: user.id,
          outcome: geminiResult.spoofDetected ? "SPOOF_DETECTED" : "LIVENESS_FAILED",
          challengeType: "gemini_face",
          serverSignals: {
            hasFace: geminiResult.hasFace,
            isLivePerson: geminiResult.isLivePerson,
            faceQuality: geminiResult.faceQuality,
            confidence: geminiResult.confidence,
            spoofDetected: geminiResult.spoofDetected,
          },
          ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
          userAgent: request.headers.get("user-agent") ?? undefined,
        },
      }).catch(() => null); // non-blocking

      return fail(
        geminiResult.spoofDetected
          ? "Spoof attempt detected. Please show your real face directly to the camera."
          : geminiResult.faceQuality === "none" || !geminiResult.hasFace
          ? "No face detected. Please ensure your face is clearly visible in the camera."
          : geminiResult.faceQuality === "poor"
          ? "Image too blurry or dark. Move to better lighting and try again."
          : !geminiResult.isLivePerson
          ? "Please show your real face — not a photo or screen."
          : `Face verification failed: ${geminiResult.reason}`,
        400,
        "FACE_VERIFICATION_FAILED",
        { quality: geminiResult.faceQuality, confidence: geminiResult.confidence },
      );
    }

    // Mark session face-verified
    await markSigninFaceVerified(user.session.sid);

    // Update user verification level
    await prisma.user.update({
      where: { id: user.id },
      data: {
        faceVerifiedAt: new Date(),
        livenessVerifiedAt: new Date(),
        verificationLevel: "FACE_VERIFIED",
      },
    }).catch(() => null); // non-blocking, don't fail the response

    // Record successful attempt
    await prisma.verificationAttempt.create({
      data: {
        verificationId: body.sessionId ?? "gemini-direct",
        userId: user.id,
        outcome: "LIVENESS_PASSED",
        challengeType: "gemini_face",
        serverSignals: {
          hasFace: geminiResult.hasFace,
          faceQuality: geminiResult.faceQuality,
          confidence: geminiResult.confidence,
        },
        ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
        userAgent: request.headers.get("user-agent") ?? undefined,
      },
    }).catch(() => null);

    return ok({
      verified: true,
      faceQuality: geminiResult.faceQuality,
      confidence: geminiResult.confidence,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
