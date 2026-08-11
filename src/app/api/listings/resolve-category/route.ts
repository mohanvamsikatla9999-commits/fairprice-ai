import { z } from "zod";
import { prisma } from "@/lib/db";
import { ok } from "@/lib/api/response";
import { handleRouteError, jsonBody } from "@/lib/api/handler";
import { NotFoundError } from "@/lib/api/errors";
import { categories as siteCategories } from "@/config/site";

const schema = z.object({
  slug: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const body = schema.parse(await jsonBody(request));
    let category = await prisma.category.findUnique({ where: { slug: body.slug } });
    if (!category) {
      const def = siteCategories.find((c) => c.slug === body.slug);
      category = await prisma.category.create({
        data: {
          name: def?.name ?? body.slug,
          slug: body.slug,
          description: def?.description,
          icon: def?.icon,
        },
      });
    }
    if (!category) throw new NotFoundError("Category not found");
    return ok({ id: category.id, slug: category.slug, name: category.name });
  } catch (error) {
    return handleRouteError(error);
  }
}
