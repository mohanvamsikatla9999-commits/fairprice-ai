import { z } from "zod";
import { requireUser } from "@/lib/auth/middleware";
import { offersService } from "@/services/offers/service";
import { notificationsService } from "@/services/notifications/service";
import { ok } from "@/lib/api/response";
import { handleRouteError, jsonBody } from "@/lib/api/handler";

const respondSchema = z.object({
  status: z.enum(["ACCEPTED", "REJECTED", "COUNTERED", "WITHDRAWN"]),
  counterAmountInr: z.number().int().positive().optional(),
  message: z.string().max(1000).optional(),
});

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Ctx) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    const offer = await offersService.getById(id);
    if (offer.buyerId !== user.id && offer.sellerId !== user.id) {
      const { ForbiddenError } = await import("@/lib/api/errors");
      throw new ForbiddenError("Not a participant of this offer");
    }
    return ok({ offer });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: Request, context: Ctx) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    const body = respondSchema.parse(await jsonBody(request));
    const result = await offersService.respond({
      offerId: id,
      actorId: user.id,
      status: body.status,
      counterAmountInr: body.counterAmountInr,
      message: body.message,
    });

    const original = await offersService.getById(id);
    const notifyUserId =
      user.id === original.buyerId ? original.sellerId : original.buyerId;
    await notificationsService.create({
      userId: notifyUserId,
      type:
        body.status === "ACCEPTED"
          ? "OFFER_ACCEPTED"
          : body.status === "COUNTERED"
            ? "COUNTER_OFFER"
            : "SYSTEM",
      title: `Offer ${body.status.toLowerCase()}`,
      body: body.message ?? `An offer was ${body.status.toLowerCase()}.`,
      href: "/messages",
    });

    return ok({ offer: result });
  } catch (error) {
    return handleRouteError(error);
  }
}
