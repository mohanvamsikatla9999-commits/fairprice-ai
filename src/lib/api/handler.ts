import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { fail } from "@/lib/api/response";
import { isAppError } from "@/lib/api/errors";
import { logger } from "@/lib/logger";

export function handleRouteError(error: unknown): NextResponse {
  if (error instanceof ZodError) {
    return fail("Validation failed", 422, "VALIDATION_ERROR", error.flatten());
  }
  if (isAppError(error)) {
    return fail(error.message, error.status, error.code, error.details);
  }
  logger.error("Unhandled API error", {
    error: error instanceof Error ? error.message : String(error),
  });
  return fail("Internal server error", 500, "INTERNAL_ERROR");
}

export async function jsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}
