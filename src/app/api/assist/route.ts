import { z } from "zod";
import { requireUser } from "@/lib/auth/middleware";
import { handleRouteError, jsonBody } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { prisma } from "@/lib/db";
import { ForbiddenError, NotFoundError, ValidationError } from "@/lib/api/errors";
import { getVerificationPolicy } from "@/services/verification/policy";

const createSchema = z.object({
  listingId: z.string().min(1),
  conversationId: z.string().optional(),
});

/**
 * FairPrice Assist — mock escrow for high-value deals.
 * Stores lifecycle on Payment + SupportTicket until a real escrow provider exists.
 */
export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = createSchema.parse(await jsonBody(request));
    const listing = await prisma.listing.findFirst({
      where: { id: body.listingId, deletedAt: null, status: "ACTIVE" },
      include: { seller: { select: { id: true, displayName: true, name: true } } },
    });
    if (!listing) throw new NotFoundError("Listing not found");
    if (listing.sellerId === user.id) {
      throw new ValidationError("Sellers cannot start assist on their own listing");
    }

    const policy = await getVerificationPolicy();
    if (listing.priceInr < policy.highValueListingInr) {
      throw new ValidationError(
        `FairPrice Assist is available for listings ₹${policy.highValueListingInr.toLocaleString("en-IN")}+`,
      );
    }

    const feeInr = Math.min(999, Math.max(149, Math.round(listing.priceInr * 0.015)));

    const payment = await prisma.payment.create({
      data: {
        userId: user.id,
        provider: "mock_escrow",
        amountInr: feeInr,
        status: "PENDING",
        purpose: "fairprice_assist",
        metadata: {
          listingId: listing.id,
          sellerId: listing.sellerId,
          conversationId: body.conversationId,
          stage: "CREATED",
        },
      },
    });

    await prisma.supportTicket.create({
      data: {
        userId: user.id,
        subject: `FairPrice Assist · ${listing.title}`,
        body: `Assist requested for listing ${listing.id}. Fee ₹${feeInr}. Awaiting buyer payment confirmation.`,
        priority: "high",
      },
    });

    return ok({
      assistId: payment.id,
      feeInr,
      stage: "CREATED",
      steps: [
        "Seller confirms availability",
        "Buyer pays via UPI — amount held by FairPrice Assist",
        "Inspect item in person at a public place",
        "Confirm receipt to release payment, or raise a dispute",
      ],
      listing: {
        id: listing.id,
        title: listing.title,
        priceInr: listing.priceInr,
        sellerName: listing.seller.displayName || listing.seller.name,
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

const advanceSchema = z.object({
  assistId: z.string().min(1),
  stage: z.enum(["FUNDED", "INSPECTED", "RELEASED", "DISPUTED", "CANCELLED"]),
});

export async function PATCH(request: Request) {
  try {
    const user = await requireUser();
    const body = advanceSchema.parse(await jsonBody(request));
    const payment = await prisma.payment.findUnique({ where: { id: body.assistId } });
    if (!payment || payment.purpose !== "fairprice_assist") {
      throw new NotFoundError("Assist case not found");
    }
    if (payment.userId !== user.id) throw new ForbiddenError();

    const meta = (payment.metadata ?? {}) as Record<string, unknown>;
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status:
          body.stage === "RELEASED"
            ? "COMPLETED"
            : body.stage === "CANCELLED"
              ? "CANCELLED"
              : "PENDING",
        metadata: { ...meta, stage: body.stage },
      },
    });

    return ok({ assistId: payment.id, stage: body.stage });
  } catch (error) {
    return handleRouteError(error);
  }
}
