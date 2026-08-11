import { z } from "zod";
import { requireCurrentPermission } from "@/lib/auth/middleware";
import { prisma } from "@/lib/db";
import { ok } from "@/lib/api/response";
import { handleRouteError, jsonBody } from "@/lib/api/handler";

export async function GET(request: Request) {
  try {
    await requireCurrentPermission("user:manage");
    const q = new URL(request.url).searchParams.get("q")?.trim();
    const users = await prisma.user.findMany({
      where: {
        deletedAt: null,
        ...(q
          ? {
              OR: [
                { email: { contains: q, mode: "insensitive" } },
                { name: { contains: q, mode: "insensitive" } },
                { displayName: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        email: true,
        name: true,
        displayName: true,
        role: true,
        trustScore: true,
        verificationLevel: true,
        isBlocked: true,
        isSuspended: true,
        createdAt: true,
      },
    });
    return ok({ users });
  } catch (error) {
    return handleRouteError(error);
  }
}

const patchSchema = z.object({
  userId: z.string(),
  role: z
    .enum([
      "USER",
      "SELLER",
      "BUYER",
      "BUSINESS",
      "MODERATOR",
      "SUPPORT",
      "ADMIN",
      "SUPER_ADMIN",
    ])
    .optional(),
  isBlocked: z.boolean().optional(),
  isSuspended: z.boolean().optional(),
  suspendedReason: z.string().optional(),
});

export async function PATCH(request: Request) {
  try {
    await requireCurrentPermission("user:manage");
    const body = patchSchema.parse(await jsonBody(request));
    const user = await prisma.user.update({
      where: { id: body.userId },
      data: {
        ...(body.role ? { role: body.role } : {}),
        ...(body.isBlocked !== undefined ? { isBlocked: body.isBlocked } : {}),
        ...(body.isSuspended !== undefined
          ? { isSuspended: body.isSuspended }
          : {}),
        ...(body.suspendedReason !== undefined
          ? { suspendedReason: body.suspendedReason }
          : {}),
      },
      select: {
        id: true,
        email: true,
        role: true,
        isBlocked: true,
        isSuspended: true,
      },
    });
    return ok({ user });
  } catch (error) {
    return handleRouteError(error);
  }
}
