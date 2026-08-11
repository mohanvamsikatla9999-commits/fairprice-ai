import { requireUser } from "@/lib/auth/middleware";
import { handleRouteError } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { identityVerificationService } from "@/services/verification";

export async function GET() {
  try {
    const user = await requireUser();
    const status = await identityVerificationService.getStatus(user.id);
    return ok(status);
  } catch (error) {
    return handleRouteError(error);
  }
}
