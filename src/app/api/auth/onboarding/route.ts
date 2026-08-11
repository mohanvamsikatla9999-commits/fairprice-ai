import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/middleware";
import { ok } from "@/lib/api/response";
import { handleRouteError, jsonBody } from "@/lib/api/handler";

const schema = z.object({
  name: z.string().min(1).max(120).optional(),
  displayName: z.string().min(1).max(120).optional(),
  bio: z.string().max(500).optional(),
  phone: z.string().min(8).max(20).optional(),
  preferredCategories: z.array(z.string()).max(20).optional(),
  interests: z.array(z.string()).max(20).optional(),
  city: z.string().max(80).optional(),
  state: z.string().max(80).optional(),
  roleIntent: z.enum(["BUYER", "SELLER", "BOTH"]).optional(),
});

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = schema.parse(await jsonBody(request));

    const role =
      body.roleIntent === "SELLER"
        ? "SELLER"
        : body.roleIntent === "BUYER"
          ? "BUYER"
          : undefined;

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(body.name ? { name: body.name } : {}),
        ...(body.displayName ? { displayName: body.displayName } : {}),
        ...(body.bio !== undefined ? { bio: body.bio } : {}),
        ...(body.phone ? { phone: body.phone } : {}),
        ...(body.preferredCategories
          ? { preferredCategories: body.preferredCategories }
          : {}),
        ...(body.interests ? { interests: body.interests } : {}),
        ...(role ? { role } : {}),
        onboardingDone: true,
        profile: {
          upsert: {
            create: {
              city: body.city,
              state: body.state,
            },
            update: {
              ...(body.city !== undefined ? { city: body.city } : {}),
              ...(body.state !== undefined ? { state: body.state } : {}),
            },
          },
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
        displayName: true,
        role: true,
        onboardingDone: true,
        preferredCategories: true,
        interests: true,
        profile: true,
      },
    });

    return ok({ user: updated });
  } catch (error) {
    return handleRouteError(error);
  }
}
