import { z } from "zod";
import { requireUser } from "@/lib/auth/middleware";
import { chatService } from "@/services/chat/service";
import { ok } from "@/lib/api/response";
import { handleRouteError, jsonBody } from "@/lib/api/handler";

const createSchema = z.object({
  listingId: z.string().min(1),
});

export async function GET() {
  try {
    const user = await requireUser();
    const items = await chatService.listConversations(user.id);
    return ok({ items });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = createSchema.parse(await jsonBody(request));
    const conversation = await chatService.getOrCreateConversation({
      listingId: body.listingId,
      buyerId: user.id,
    });
    return ok({ conversation }, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
