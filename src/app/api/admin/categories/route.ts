import { z } from "zod";
import { requireCurrentPermission } from "@/lib/auth/middleware";
import { handleRouteError, jsonBody } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { prisma } from "@/lib/db";
import { ValidationError, NotFoundError } from "@/lib/api/errors";

const createSchema = z.object({
  name: z.string().min(1).max(80),
  slug: z.string().min(1).max(80).regex(/^[a-z0-9-]+$/),
  description: z.string().optional(),
  icon: z.string().optional(),
  parentId: z.string().nullable().optional(),
  sortOrder: z.number().int().default(0),
});

const updateSchema = createSchema.partial().extend({ id: z.string() });

export async function GET() {
  try {
    await requireCurrentPermission("admin:categories");
    const categories = await prisma.category.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: {
        _count: { select: { listings: true, children: true } },
      },
    });
    return ok({ categories });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireCurrentPermission("admin:categories");
    const body = createSchema.parse(await jsonBody(request));
    const existing = await prisma.category.findUnique({ where: { slug: body.slug } });
    if (existing) throw new ValidationError(`Slug "${body.slug}" already exists`);
    const category = await prisma.category.create({ data: body });
    return ok({ category }, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    await requireCurrentPermission("admin:categories");
    const body = updateSchema.parse(await jsonBody(request));
    const { id, ...data } = body;
    const category = await prisma.category.update({ where: { id }, data });
    return ok({ category });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    await requireCurrentPermission("admin:categories");
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) throw new ValidationError("id required");
    const cat = await prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { listings: true, children: true } } },
    });
    if (!cat) throw new NotFoundError("Category not found");
    if (cat._count.listings > 0) throw new ValidationError(`Cannot delete: ${cat._count.listings} listings use this category`);
    if (cat._count.children > 0) throw new ValidationError(`Cannot delete: has ${cat._count.children} subcategories`);
    await prisma.category.delete({ where: { id } });
    return ok({ deleted: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
