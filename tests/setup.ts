/**
 * Vitest setup — unit tests run in Node without a live database.
 * Prisma client types are used only as TypeScript types where needed.
 */
if (!process.env.NODE_ENV) {
  Object.defineProperty(process.env, "NODE_ENV", { value: "test", writable: true });
}
process.env.AUTH_SECRET ??= "test-auth-secret-at-least-32-characters-long";
process.env.DATABASE_URL ??=
  "postgresql://fairprice:fairprice@localhost:5432/fairprice_ai_test?schema=public";
process.env.AI_PROVIDER ??= "mock";
