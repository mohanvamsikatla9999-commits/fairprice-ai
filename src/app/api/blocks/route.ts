import { z } from "zod";
import { requireUser } from "@/lib/auth/middleware";
import { prisma } from "@/lib/db";
import { ok } from "@/lib/api/response";
import { handleRouteError, jsonBody } from "@/lib/api/handler";
import { ValidationError } from "@/lib/api/errors";

const schema = z.object({
  blockedId: z.string().min(1),
  reason: z.string().max(500).optional(),
});

export async function GET() {
  try {
    const user = await requireUser();
    const items = await prisma.block.findMany({
      where: { blockerId: user.id },
      include: {
        blocked: {
          select: { id: true, name: true, displayName: true, avatarUrl: true },
        },
      },
      orderBy: { createdAt: "desc" },
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
    if (body.blockedId === user.id) {
      throw new ValidationError("You cannot block yourself");
    }

    const block = await prisma.block.upsert({
      where: {
        blockerId_blockedId: {
          blockerId: user.id,
          blockedId: body.blockedId,
        },
      },
      create: {
        blockerId: user.id,
        blockedId: body.blockedId,
        reason: body.reason,
      },
      update: { reason: body.reason },
    });
    return ok({ block }, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(request.url);
    const blockedId = searchParams.get("blockedId");
    if (!blockedId) throw new ValidationError("blockedId required");
    await prisma.block.deleteMany({
      where: { blockerId: user.id, blockedId },
    });
    return ok({ unblocked: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
