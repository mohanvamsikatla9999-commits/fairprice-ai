import { z } from "zod";
import { requireUser } from "@/lib/auth/middleware";
import { offersService } from "@/services/offers/service";
import { notificationsService } from "@/services/notifications/service";
import { ok } from "@/lib/api/response";
import { handleRouteError, jsonBody } from "@/lib/api/handler";

const createSchema = z.object({
  listingId: z.string().min(1),
  amountInr: z.number().int().positive(),
  message: z.string().max(1000).optional(),
  conversationId: z.string().optional(),
  parentOfferId: z.string().optional(),
  expiresInHours: z.number().int().positive().max(168).optional(),
});

export async function GET() {
  try {
    const user = await requireUser();
    const items = await offersService.listForUser(user.id);
    return ok({ items });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = createSchema.parse(await jsonBody(request));
    const offer = await offersService.create({
      ...body,
      buyerId: user.id,
    });

    await notificationsService.create({
      userId: offer.sellerId,
      type: "OFFER_RECEIVED",
      title: "New offer received",
      body: `You received an offer of ₹${offer.amountInr.toLocaleString("en-IN")} on ${offer.listing.title}`,
      href: `/messages`,
    });

    return ok({ offer }, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
