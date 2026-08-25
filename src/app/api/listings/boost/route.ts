import { z } from "zod";
import { requireUser } from "@/lib/auth/middleware";
import { handleRouteError, jsonBody } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { prisma } from "@/lib/db";
import { ForbiddenError, NotFoundError } from "@/lib/api/errors";
import { createPaymentProvider } from "@/providers/payment";

const BOOST_PRICE_INR = 99;
const FEATURED_PRICE_INR = 249;

const schema = z.object({
  listingId: z.string().min(1),
  type: z.enum(["BOOST", "FEATURED"]),
  days: z.number().int().min(1).max(30).default(7),
});

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = schema.parse(await jsonBody(request));
    const listing = await prisma.listing.findFirst({
      where: { id: body.listingId, deletedAt: null },
    });
    if (!listing) throw new NotFoundError("Listing not found");
    if (listing.sellerId !== user.id) {
      throw new ForbiddenError("You can only boost your own listings");
    }

    const amountInr = body.type === "FEATURED" ? FEATURED_PRICE_INR : BOOST_PRICE_INR;
    const payment = createPaymentProvider();
    const intent = await payment.createIntent({
      userId: user.id,
      amountInr,
      purpose: `listing_${body.type.toLowerCase()}`,
      metadata: { listingId: listing.id },
    });

    const captured = await payment.capture({ paymentId: intent.id });

    const startsAt = new Date();
    const endsAt = new Date(Date.now() + body.days * 24 * 60 * 60 * 1000);

    const [promotion] = await prisma.$transaction([
      prisma.promotion.create({
        data: {
          userId: user.id,
          listingId: listing.id,
          type: body.type === "FEATURED" ? "FEATURED" : "BOOST",
          startsAt,
          endsAt,
          amountInr,
          status: "active",
        },
      }),
      prisma.listing.update({
        where: { id: listing.id },
        data: {
          isBoosted: true,
          ...(body.type === "FEATURED" ? { isFeatured: true } : {}),
        },
      }),
      prisma.payment.create({
        data: {
          userId: user.id,
          provider: captured.provider,
          providerRef: captured.providerRef,
          amountInr,
          status: "COMPLETED",
          purpose: `listing_${body.type.toLowerCase()}`,
          metadata: { listingId: listing.id, promotionType: body.type },
        },
      }),
    ]);

    return ok({
      promotion,
      payment: { id: captured.id, status: captured.status, amountInr },
      message:
        body.type === "FEATURED"
          ? `Listing featured for ${body.days} days.`
          : `Listing boosted for ${body.days} days.`,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
