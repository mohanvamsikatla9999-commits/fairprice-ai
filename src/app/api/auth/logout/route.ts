import { destroySession } from "@/lib/auth/session";
import { ok } from "@/lib/api/response";
import { handleRouteError } from "@/lib/api/handler";

export async function POST() {
  try {
    await destroySession();
    return ok({ loggedOut: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
