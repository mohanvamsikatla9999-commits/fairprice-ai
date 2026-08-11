import type { OfferStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { ForbiddenError, NotFoundError, ValidationError } from "@/lib/api/errors";

export type CreateOfferInput = {
  listingId: string;
  buyerId: string;
  amountInr: number;
  message?: string;
  conversationId?: string;
  parentOfferId?: string;
  expiresInHours?: number;
};

export class OffersService {
  async create(input: CreateOfferInput) {
    const listing = await prisma.listing.findFirst({
      where: { id: input.listingId, deletedAt: null, status: "ACTIVE" },
    });
    if (!listing) throw new NotFoundError("Listing not found or not active");
    if (listing.sellerId === input.buyerId) {
      throw new ValidationError("You cannot offer on your own listing");
    }
    if (input.amountInr <= 0) {
      throw new ValidationError("Offer amount must be positive");
    }

    const expiresAt = new Date(
      Date.now() + (input.expiresInHours ?? 48) * 60 * 60 * 1000,
    );

    const offer = await prisma.offer.create({
      data: {
        listingId: input.listingId,
        buyerId: input.buyerId,
        sellerId: listing.sellerId,
        amountInr: input.amountInr,
        message: input.message,
        conversationId: input.conversationId,
        parentOfferId: input.parentOfferId,
        expiresAt,
        status: "PENDING",
        history: {
          create: {
            amountInr: input.amountInr,
            status: "PENDING",
            actorId: input.buyerId,
            note: input.message,
          },
        },
      },
      include: { listing: true },
    });

    return offer;
  }

  async getById(id: string) {
    const offer = await prisma.offer.findUnique({
      where: { id },
      include: {
        listing: true,
        history: { orderBy: { createdAt: "asc" } },
      },
    });
    if (!offer) throw new NotFoundError("Offer not found");
    return offer;
  }

  async respond(options: {
    offerId: string;
    actorId: string;
    status: Extract<OfferStatus, "ACCEPTED" | "REJECTED" | "COUNTERED" | "WITHDRAWN">;
    counterAmountInr?: number;
    message?: string;
  }) {
    const offer = await this.getById(options.offerId);
    const isBuyer = offer.buyerId === options.actorId;
    const isSeller = offer.sellerId === options.actorId;
    if (!isBuyer && !isSeller) {
      throw new ForbiddenError("Not a participant of this offer");
    }

    if (options.status === "WITHDRAWN" && !isBuyer) {
      throw new ForbiddenError("Only the buyer can withdraw an offer");
    }
    if (
      (options.status === "ACCEPTED" || options.status === "REJECTED") &&
      !isSeller
    ) {
      throw new ForbiddenError("Only the seller can accept or reject");
    }

    if (options.status === "COUNTERED") {
      if (!options.counterAmountInr || options.counterAmountInr <= 0) {
        throw new ValidationError("Counter amount required");
      }
      const counter = await prisma.offer.create({
        data: {
          listingId: offer.listingId,
          buyerId: offer.buyerId,
          sellerId: offer.sellerId,
          conversationId: offer.conversationId,
          parentOfferId: offer.id,
          amountInr: options.counterAmountInr,
          message: options.message,
          status: "PENDING",
          expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
          history: {
            create: {
              amountInr: options.counterAmountInr,
              status: "PENDING",
              actorId: options.actorId,
              note: options.message ?? "Counter offer",
            },
          },
        },
      });

      await prisma.offer.update({
        where: { id: offer.id },
        data: {
          status: "COUNTERED",
          respondedAt: new Date(),
          history: {
            create: {
              amountInr: offer.amountInr,
              status: "COUNTERED",
              actorId: options.actorId,
              note: options.message,
            },
          },
        },
      });

      return counter;
    }

    return prisma.offer.update({
      where: { id: offer.id },
      data: {
        status: options.status,
        respondedAt: new Date(),
        history: {
          create: {
            amountInr: offer.amountInr,
            status: options.status,
            actorId: options.actorId,
            note: options.message,
          },
        },
      },
    });
  }

  async listForUser(userId: string, take = 50) {
    return prisma.offer.findMany({
      where: {
        OR: [{ buyerId: userId }, { sellerId: userId }],
      },
      orderBy: { createdAt: "desc" },
      take,
      include: {
        listing: {
          select: { id: true, title: true, slug: true, priceInr: true },
        },
      },
    });
  }
}

export const offersService = new OffersService();
