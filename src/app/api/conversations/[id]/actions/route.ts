import { z } from "zod";
import { requireUser } from "@/lib/auth/middleware";
import { handleRouteError, jsonBody } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { prisma } from "@/lib/db";
import { ForbiddenError, NotFoundError, ValidationError } from "@/lib/api/errors";
import { chatService } from "@/services/chat/service";
import {
  BUYER_CANNED_REPLIES,
  SELLER_CANNED_REPLIES,
  maskPhone,
  meetupSuggestions,
} from "@/services/chat/deal-helpers";

type Ctx = { params: Promise<{ id: string }> };

async function assertParticipant(conversationId: string, userId: string) {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      listing: { select: { id: true, title: true, city: true, sellerId: true, status: true } },
      buyer: { select: { id: true, phone: true, phoneVerified: true } },
      seller: { select: { id: true, phone: true, phoneVerified: true } },
    },
  });
  if (!conversation) throw new NotFoundError("Conversation not found");
  if (conversation.buyerId !== userId && conversation.sellerId !== userId) {
    throw new ForbiddenError("Not a participant");
  }
  return conversation;
}

export async function GET(_request: Request, ctx: Ctx) {
  try {
    const user = await requireUser();
    const { id } = await ctx.params;
    const conversation = await assertParticipant(id, user.id);
    const isSeller = conversation.sellerId === user.id;
    return ok({
      cannedReplies: isSeller ? SELLER_CANNED_REPLIES : BUYER_CANNED_REPLIES,
      meetupPlaces: meetupSuggestions(conversation.listing.city),
      listingId: conversation.listing.id,
      listingStatus: conversation.listing.status,
      canMarkSold: isSeller && conversation.listing.status === "ACTIVE",
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

const schema = z.object({
  action: z.enum(["meetup", "request_phone", "reveal_phone", "mark_sold", "canned"]),
  place: z.string().optional(),
  canned: z.string().optional(),
});

export async function POST(request: Request, ctx: Ctx) {
  try {
    const user = await requireUser();
    const { id } = await ctx.params;
    const body = schema.parse(await jsonBody(request));
    const conversation = await assertParticipant(id, user.id);

    if (body.action === "canned" && body.canned) {
      const message = await chatService.sendMessage({
        conversationId: id,
        senderId: user.id,
        body: body.canned,
      });
      return ok({ message });
    }

    if (body.action === "meetup") {
      const place =
        body.place ||
        meetupSuggestions(conversation.listing.city)[0] ||
        "a public mall";
      const message = await chatService.sendMessage({
        conversationId: id,
        senderId: user.id,
        body: `Shall we meet at ${place}? Public places are safer — inspect before paying, never share OTPs.`,
      });
      return ok({ message, place });
    }

    if (body.action === "request_phone") {
      const message = await chatService.sendMessage({
        conversationId: id,
        senderId: user.id,
        body: "I'd like to exchange phone numbers after we both agree. Please use Reveal phone in FairPrice chat when ready.",
      });
      return ok({ message });
    }

    if (body.action === "reveal_phone") {
      const me =
        conversation.buyerId === user.id ? conversation.buyer : conversation.seller;
      if (!me.phone || !me.phoneVerified) {
        throw new ValidationError("Verify your phone in settings before revealing it");
      }
      const masked = maskPhone(me.phone);
      const message = await chatService.sendMessage({
        conversationId: id,
        senderId: user.id,
        body: `My verified phone (masked): ${masked}. Full number shared securely: ${me.phone}. Prefer call over WhatsApp advances.`,
      });
      return ok({ message, masked });
    }

    if (body.action === "mark_sold") {
      if (conversation.sellerId !== user.id) {
        throw new ForbiddenError("Only the seller can mark as sold");
      }
      await prisma.listing.update({
        where: { id: conversation.listing.id },
        data: { status: "SOLD", soldAt: new Date() },
      });
      const message = await chatService.sendMessage({
        conversationId: id,
        senderId: user.id,
        body: "Marked as sold on FairPrice AI. Thanks for dealing safely!",
      });
      return ok({ message, sold: true });
    }

    throw new ValidationError("Unknown action");
  } catch (error) {
    return handleRouteError(error);
  }
}
