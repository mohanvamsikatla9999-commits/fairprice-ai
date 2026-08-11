import { getCurrentUser } from "@/lib/auth/middleware";
import { prisma } from "@/lib/db";
import { ok, fail } from "@/lib/api/response";
import { handleRouteError } from "@/lib/api/handler";

export async function GET() {
  try {
    const current = await getCurrentUser();
    if (!current) return fail("Authentication required", 401, "UNAUTHORIZED");

    const user = await prisma.user.findUnique({
      where: { id: current.id },
      select: {
        id: true,
        email: true,
        name: true,
        displayName: true,
        avatarUrl: true,
        phone: true,
        role: true,
        verificationLevel: true,
        trustScore: true,
        sellerTrustScore: true,
        buyerTrustScore: true,
        onboardingDone: true,
        preferredCategories: true,
        interests: true,
        bio: true,
        emailVerified: true,
        phoneVerified: true,
        isSuspended: true,
        createdAt: true,
        profile: true,
      },
    });

    if (!user) return fail("User not found", 404, "NOT_FOUND");
    return ok({
      user,
      requiresFaceVerification: current.requiresSigninFace,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
