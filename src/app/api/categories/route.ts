import { prisma } from "@/lib/db";
import { ok } from "@/lib/api/response";
import { handleRouteError } from "@/lib/api/handler";

export type CategoryTreeNode = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  description: string | null;
  parentId: string | null;
  sortOrder: number;
  attributes: Array<{
    id: string;
    key: string;
    label: string;
    type: string;
    options: string[];
    required: boolean;
    unit: string | null;
  }>;
  children: CategoryTreeNode[];
};

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      include: {
        attributes: { orderBy: { sortOrder: "asc" } },
      },
      orderBy: { sortOrder: "asc" },
    });

    const byParent = new Map<string | null, typeof categories>();
    for (const cat of categories) {
      const key = cat.parentId;
      const list = byParent.get(key) ?? [];
      list.push(cat);
      byParent.set(key, list);
    }

    function build(parentId: string | null): CategoryTreeNode[] {
      return (byParent.get(parentId) ?? []).map((cat) => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        icon: cat.icon,
        description: cat.description,
        parentId: cat.parentId,
        sortOrder: cat.sortOrder,
        attributes: cat.attributes.map((a) => ({
          id: a.id,
          key: a.key,
          label: a.label,
          type: a.type,
          options: a.options,
          required: a.required,
          unit: a.unit,
        })),
        children: build(cat.id),
      }));
    }

    return ok({ categories: build(null) });
  } catch (error) {
    return handleRouteError(error);
  }
}
