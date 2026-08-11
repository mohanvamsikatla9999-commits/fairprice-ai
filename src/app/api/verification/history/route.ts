import { requireUser } from "@/lib/auth/middleware";
import { handleRouteError } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { identityVerificationService } from "@/services/verification";

export async function GET() {
  try {
    const user = await requireUser();
    const history = await identityVerificationService.listHistory(user.id);
    return ok({ history });
  } catch (error) {
    return handleRouteError(error);
  }
}
