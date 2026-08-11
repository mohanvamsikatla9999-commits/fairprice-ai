import { requireUser } from "@/lib/auth/middleware";
import { listingsService } from "@/services/listings/service";
import { moderationService } from "@/services/moderation/service";
import { ok } from "@/lib/api/response";
import { handleRouteError } from "@/lib/api/handler";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: Ctx) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    await listingsService.publish(id, user.id);
    const assessment = await moderationService.autoModerateListing(id);
    const listing = await listingsService.getById(id);
    return ok({ listing, assessment });
  } catch (error) {
    return handleRouteError(error);
  }
}
