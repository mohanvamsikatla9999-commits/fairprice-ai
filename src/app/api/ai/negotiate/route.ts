import { z } from "zod";
import { getAIService } from "@/lib/ai/service";
import { ok } from "@/lib/api/response";
import { handleRouteError, jsonBody } from "@/lib/api/handler";

const schema = z.object({
  role: z.enum(["buyer", "seller"]).default("buyer"),
  listingTitle: z.string().min(1),
  askingPriceInr: z.number().int().positive(),
  fairValueMidInr: z.number().int().positive(),
  fairValueMinInr: z.number().int().positive().optional(),
  fairValueMaxInr: z.number().int().positive().optional(),
  offerInr: z.number().int().positive().optional(),
  conditionGrade: z.string().optional(),
  city: z.string().optional(),
  context: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = schema.parse(await jsonBody(request));
    const ai = getAIService();

    let advice;
    try {
      advice = await ai.negotiate(body);
    } catch {
      const target = Math.round(body.fairValueMidInr * 0.94);
      advice = {
        suggestedOfferInr: body.offerInr ?? target,
        message:
          body.role === "buyer"
            ? `Hi! Interested in your ${body.listingTitle}. Based on recent market comps, would you consider ₹${target.toLocaleString("en-IN")}? Happy to meet locally.`
            : `Thanks for the interest. My best price right now is near ₹${Math.round(body.fairValueMidInr * 1.02).toLocaleString("en-IN")}.`,
        talkingPoints: [
          "Reference FairPrice mid value",
          "Confirm condition in person",
          "Prefer public meeting spot",
        ],
        walkAwayBelowInr: Math.round(body.fairValueMidInr * 0.85),
        confidence: 0.5,
      };
    }

    return ok({ advice });
  } catch (error) {
    return handleRouteError(error);
  }
}
