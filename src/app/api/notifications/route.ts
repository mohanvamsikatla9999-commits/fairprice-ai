import { z } from "zod";
import { requireUser } from "@/lib/auth/middleware";
import { notificationsService } from "@/services/notifications/service";
import { ok } from "@/lib/api/response";
import { handleRouteError, jsonBody } from "@/lib/api/handler";

const markSchema = z.object({
  id: z.string().optional(),
  all: z.boolean().optional(),
});

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const unreadOnly =
      new URL(request.url).searchParams.get("unread") === "1";
    const items = await notificationsService.listForUser(user.id, {
      unreadOnly,
    });
    const unreadCount = await notificationsService.unreadCount(user.id);
    return ok({ items, unreadCount });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireUser();
    const body = markSchema.parse(await jsonBody(request));
    if (body.all) {
      await notificationsService.markAllRead(user.id);
    } else if (body.id) {
      await notificationsService.markRead(body.id, user.id);
    }
    const unreadCount = await notificationsService.unreadCount(user.id);
    return ok({ unreadCount });
  } catch (error) {
    return handleRouteError(error);
  }
}
