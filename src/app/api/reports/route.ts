import { z } from "zod";
import { requireUser } from "@/lib/auth/middleware";
import { prisma } from "@/lib/db";
import { ok } from "@/lib/api/response";
import { handleRouteError, jsonBody } from "@/lib/api/handler";

const schema = z.object({
  targetType: z.enum([
    "LISTING",
    "SELLER",
    "BUYER",
    "MESSAGE",
    "REVIEW",
    "FRAUD",
    "COUNTERFEIT",
    "PROHIBITED_ITEM",
    "SPAM",
    "HARASSMENT",
    "MISLEADING",
    "WRONG_PRICE",
    "STOLEN_ITEM",
  ]),
  reason: z.string().min(3).max(500),
  details: z.string().max(2000).optional(),
  listingId: z.string().optional(),
  targetUserId: z.string().optional(),
  messageId: z.string().optional(),
});

export async function GET() {
  try {
    const user = await requireUser();
    const items = await prisma.report.findMany({
      where: { reporterId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return ok({ items });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = schema.parse(await jsonBody(request));
    const report = await prisma.report.create({
      data: {
        reporterId: user.id,
        targetType: body.targetType,
        reason: body.reason,
        details: body.details,
        listingId: body.listingId,
        targetUserId: body.targetUserId,
        messageId: body.messageId,
      },
    });
    return ok({ report }, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
