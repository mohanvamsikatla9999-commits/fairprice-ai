import { z } from "zod";
import { getAIService } from "@/lib/ai/service";
import { scoreToConditionGrade } from "@/services/valuation";
import { getCurrentUser } from "@/lib/auth/middleware";
import { prisma } from "@/lib/db";
import { ok } from "@/lib/api/response";
import { handleRouteError, jsonBody } from "@/lib/api/handler";

const schema = z.object({
  listingId: z.string().optional(),
  category: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  visibleDamage: z.array(z.string()).optional(),
  ageMonths: z.number().optional(),
  notes: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    const body = schema.parse(await jsonBody(request));
    const ai = getAIService();

    let assessment;
    try {
      assessment = await ai.assessCondition(body);
    } catch {
      const score = body.visibleDamage?.length
        ? Math.max(35, 80 - body.visibleDamage.length * 12)
        : 72;
      assessment = {
        score,
        grade: scoreToConditionGrade(score),
        confidence: 0.55,
        visibleDamage: body.visibleDamage ?? [],
        explanation:
          "Heuristic condition estimate based on provided details. AI provider unavailable.",
        insufficientQuality: false,
        suspiciousPatterns: [] as string[],
      };
    }

    if (body.listingId) {
      await prisma.conditionAssessment.upsert({
        where: { listingId: body.listingId },
        create: {
          listingId: body.listingId,
          userId: user?.id,
          score: assessment.score,
          grade: assessment.grade,
          confidence: assessment.confidence,
          visibleDamage: assessment.visibleDamage ?? [],
          explanation: assessment.explanation,
          insufficientQuality: assessment.insufficientQuality ?? false,
          suspiciousPatterns: assessment.suspiciousPatterns ?? [],
          rawAiResponse: assessment,
        },
        update: {
          userId: user?.id,
          score: assessment.score,
          grade: assessment.grade,
          confidence: assessment.confidence,
          visibleDamage: assessment.visibleDamage ?? [],
          explanation: assessment.explanation,
          insufficientQuality: assessment.insufficientQuality ?? false,
          suspiciousPatterns: assessment.suspiciousPatterns ?? [],
          rawAiResponse: assessment,
        },
      });
    }

    return ok({ assessment });
  } catch (error) {
    return handleRouteError(error);
  }
}
