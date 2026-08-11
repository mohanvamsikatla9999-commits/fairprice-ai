import { z } from "zod";
import { parseNaturalLanguageQuery } from "@/services/search/nl-parser";
import { searchService } from "@/services/search/service";
import { ok } from "@/lib/api/response";
import { handleRouteError, jsonBody } from "@/lib/api/handler";

const schema = z.object({
  query: z.string().min(2).max(500),
  page: z.number().int().positive().optional(),
  pageSize: z.number().int().positive().max(48).optional(),
});

export async function POST(request: Request) {
  try {
    const body = schema.parse(await jsonBody(request));
    const filters = await parseNaturalLanguageQuery(body.query);
    const result = await searchService.search({
      ...filters,
      page: body.page,
      pageSize: body.pageSize,
    });
    return ok({ filters, ...result });
  } catch (error) {
    return handleRouteError(error);
  }
}
