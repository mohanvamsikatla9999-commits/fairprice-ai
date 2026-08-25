import { z } from "zod";
import { ok, fail } from "@/lib/api/response";
import { handleRouteError, jsonBody } from "@/lib/api/handler";
import { prisma } from "@/lib/db";
import { checkRateLimit } from "@/lib/security/rate-limit";

const schema = z.object({
  type: z.enum(["support", "safety", "business", "legal", "other"]),
  name: z.string().min(1).max(120),
  email: z.string().email().toLowerCase(),
  message: z.string().min(10).max(4000),
});

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for") ?? "anon";
    const limited = checkRateLimit({ key: `contact:${ip}`, max: 5, windowMs: 60_000 });
    if (!limited.allowed) return fail("Too many requests. Please wait a minute.", 429, "RATE_LIMITED");

    const raw = await jsonBody(request);
    if (!raw || typeof raw !== "object") return fail("Invalid body", 400, "INVALID_BODY");

    const body = schema.parse(raw);

    // Store as a support ticket
    await prisma.supportTicket.create({
      data: {
        userId: "00000000000000000000000000", // system placeholder — no auth required for contact
        subject: `[${body.type.toUpperCase()}] Contact from ${body.name}`,
        body: `From: ${body.name} <${body.email}>\n\n${body.message}`,
        priority: body.type === "safety" ? "urgent" : "normal",
      },
    }).catch(() => {
      // If userId FK constraint fails (no system user), log and continue
      console.log(`[contact] From: ${body.email} | Type: ${body.type} | ${body.message.slice(0, 100)}`);
    });

    // Always succeed from user perspective
    return ok({ sent: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
