import { z } from "zod";
import { requireUser } from "@/lib/auth/middleware";
import { chatService } from "@/services/chat/service";
import { notificationsService } from "@/services/notifications/service";
import { prisma } from "@/lib/db";
import { ok } from "@/lib/api/response";
import { handleRouteError, jsonBody } from "@/lib/api/handler";

const sendSchema = z.object({
  body: z.string().min(1).max(4000),
  imageUrl: z.string().url().optional(),
  offerId: z.string().optional(),
});

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Ctx) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    const messages = await chatService.getMessages(id, user.id);
    await chatService.markRead(id, user.id);
    return ok({ messages });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request, context: Ctx) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    const body = sendSchema.parse(await jsonBody(request));
    const message = await chatService.sendMessage({
      conversationId: id,
      senderId: user.id,
      body: body.body,
      imageUrl: body.imageUrl,
      offerId: body.offerId,
    });

    const conversation = await prisma.conversation.findUnique({
      where: { id },
    });
    if (conversation) {
      const recipientId =
        conversation.buyerId === user.id
          ? conversation.sellerId
          : conversation.buyerId;
      await notificationsService.create({
        userId: recipientId,
        type: "NEW_MESSAGE",
        title: "New message",
        body: body.body.slice(0, 120),
        href: `/messages/${id}`,
      });
    }

    return ok({ message }, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
