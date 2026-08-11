import { prisma } from "@/lib/db";
import { ForbiddenError, NotFoundError, ValidationError } from "@/lib/api/errors";
import { scanMessage } from "@/services/fraud/message-scanner";
import { sanitizeText } from "@/lib/security/sanitize";

export class ChatService {
  async getOrCreateConversation(options: {
    listingId: string;
    buyerId: string;
  }) {
    const listing = await prisma.listing.findFirst({
      where: { id: options.listingId, deletedAt: null },
    });
    if (!listing) throw new NotFoundError("Listing not found");
    if (listing.sellerId === options.buyerId) {
      throw new ValidationError("Cannot chat with yourself on your listing");
    }

    return prisma.conversation.upsert({
      where: {
        listingId_buyerId: {
          listingId: options.listingId,
          buyerId: options.buyerId,
        },
      },
      create: {
        listingId: options.listingId,
        buyerId: options.buyerId,
        sellerId: listing.sellerId,
      },
      update: {},
      include: {
        listing: { select: { id: true, title: true, slug: true, priceInr: true } },
        buyer: { select: { id: true, name: true, displayName: true, avatarUrl: true } },
        seller: { select: { id: true, name: true, displayName: true, avatarUrl: true } },
      },
    });
  }

  async listConversations(userId: string, take = 50) {
    return prisma.conversation.findMany({
      where: {
        OR: [
          { buyerId: userId, buyerArchived: false },
          { sellerId: userId, sellerArchived: false },
        ],
      },
      orderBy: [{ lastMessageAt: "desc" }, { updatedAt: "desc" }],
      take,
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            slug: true,
            priceInr: true,
            images: { where: { isPrimary: true }, take: 1 },
          },
        },
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
        buyer: { select: { id: true, name: true, displayName: true, avatarUrl: true } },
        seller: { select: { id: true, name: true, displayName: true, avatarUrl: true } },
      },
    });
  }

  async getMessages(conversationId: string, userId: string, take = 100) {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });
    if (!conversation) throw new NotFoundError("Conversation not found");
    if (conversation.buyerId !== userId && conversation.sellerId !== userId) {
      throw new ForbiddenError("Not a participant");
    }

    return prisma.message.findMany({
      where: { conversationId, deletedAt: null },
      orderBy: { createdAt: "asc" },
      take,
      include: {
        sender: {
          select: { id: true, name: true, displayName: true, avatarUrl: true },
        },
      },
    });
  }

  async sendMessage(options: {
    conversationId: string;
    senderId: string;
    body: string;
    imageUrl?: string;
    offerId?: string;
  }) {
    const conversation = await prisma.conversation.findUnique({
      where: { id: options.conversationId },
      include: { listing: { select: { priceInr: true } }, messages: { take: 1 } },
    });
    if (!conversation) throw new NotFoundError("Conversation not found");
    if (
      conversation.buyerId !== options.senderId &&
      conversation.sellerId !== options.senderId
    ) {
      throw new ForbiddenError("Not a participant");
    }

    const body = sanitizeText(options.body, 4000);
    if (!body && !options.imageUrl) {
      throw new ValidationError("Message body required");
    }

    const scan = scanMessage(body, {
      isFirstMessage: conversation.messages.length === 0,
      listingPriceInr: conversation.listing.priceInr,
    });

    const message = await prisma.message.create({
      data: {
        conversationId: options.conversationId,
        senderId: options.senderId,
        body,
        imageUrl: options.imageUrl,
        offerId: options.offerId,
        riskScore: scan.riskScore,
        riskFlags: scan.flags,
        safetyWarning: scan.warning,
      },
    });

    await prisma.conversation.update({
      where: { id: options.conversationId },
      data: { lastMessageAt: new Date() },
    });

    return message;
  }

  async markRead(conversationId: string, userId: string) {
    await prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: userId },
        readAt: null,
        deletedAt: null,
      },
      data: { readAt: new Date() },
    });
  }
}

export const chatService = new ChatService();
