import { z } from "zod";
import { requireUser, requireCurrentPermission } from "@/lib/auth/middleware";
import { prisma } from "@/lib/db";
import { ok } from "@/lib/api/response";
import { handleRouteError, jsonBody } from "@/lib/api/handler";
import { generateApiKey } from "@/lib/api/auth-helpers";
import { hasPermission } from "@/lib/auth/rbac";

const createSchema = z.object({
  name: z.string().min(1).max(80),
  scopes: z.array(z.string()).optional(),
});

export async function GET() {
  try {
    const user = await requireUser();
    if (!hasPermission(user.role, "business:api") && !hasPermission(user.role, "admin:access")) {
      await requireCurrentPermission("business:api");
    }
    const keys = await prisma.aPIKey.findMany({
      where: { userId: user.id, revokedAt: null },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        scopes: true,
        lastUsedAt: true,
        expiresAt: true,
        createdAt: true,
      },
    });
    return ok({ keys });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    if (!hasPermission(user.role, "business:api") && !hasPermission(user.role, "admin:access")) {
      await requireCurrentPermission("business:api");
    }
    const body = createSchema.parse(await jsonBody(request));
    const generated = generateApiKey();
    const key = await prisma.aPIKey.create({
      data: {
        userId: user.id,
        name: body.name,
        keyHash: generated.hash,
        keyPrefix: generated.prefix,
        scopes: body.scopes ?? ["valuation:read"],
      },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        scopes: true,
        createdAt: true,
      },
    });
    return ok({ key, secret: generated.raw }, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await requireUser();
    const id = new URL(request.url).searchParams.get("id");
    if (!id) {
      const { ValidationError } = await import("@/lib/api/errors");
      throw new ValidationError("id required");
    }
    await prisma.aPIKey.updateMany({
      where: { id, userId: user.id },
      data: { revokedAt: new Date() },
    });
    return ok({ revoked: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
