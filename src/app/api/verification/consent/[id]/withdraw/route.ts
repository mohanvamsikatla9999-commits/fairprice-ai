import { requireUser } from "@/lib/auth/middleware";
import { prisma } from "@/lib/db";
import { ok, fail } from "@/lib/api/response";
import { handleRouteError } from "@/lib/api/handler";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: Ctx) {
  try {
    const user = await requireUser();
    const { id } = await context.params;

    const consent = await prisma.verificationConsent.findFirst({
      where: { id, userId: user.id },
    });

    if (!consent) return fail("Consent record not found", 404, "NOT_FOUND");
    if (consent.withdrawnAt) return fail("Consent already withdrawn", 400, "ALREADY_WITHDRAWN");

    await prisma.verificationConsent.update({
      where: { id },
      data: { withdrawnAt: new Date() },
    });

    return ok({ withdrawn: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
