import { getAIService } from "@/lib/ai/service";
import type { SearchFiltersAi } from "@/lib/ai/schemas";
import type { SearchFilters } from "./service";
import { categories } from "@/config/site";

const CITY_HINTS = [
  "bengaluru",
  "bangalore",
  "mumbai",
  "delhi",
  "hyderabad",
  "chennai",
  "pune",
  "kolkata",
  "ahmedabad",
  "jaipur",
];

function heuristicParse(query: string): SearchFilters {
  const q = query.trim();
  const lower = q.toLowerCase();

  let minPriceInr: number | undefined;
  let maxPriceInr: number | undefined;

  const under = lower.match(/(?:under|below|less than)\s*(?:rs\.?|₹)?\s*([\d,]+)/i);
  if (under?.[1]) {
    maxPriceInr = Number.parseInt(under[1].replace(/,/g, ""), 10);
  }
  const between = lower.match(
    /(?:between|from)\s*(?:rs\.?|₹)?\s*([\d,]+)\s*(?:to|-|and)\s*(?:rs\.?|₹)?\s*([\d,]+)/i,
  );
  if (between?.[1] && between[2]) {
    minPriceInr = Number.parseInt(between[1].replace(/,/g, ""), 10);
    maxPriceInr = Number.parseInt(between[2].replace(/,/g, ""), 10);
  }

  const category = categories.find((c) => lower.includes(c.slug) || lower.includes(c.name.toLowerCase()));
  const city = CITY_HINTS.find((c) => lower.includes(c));

  let conditionGrade: SearchFilters["conditionGrade"];
  if (/like\s*new|mint/.test(lower)) conditionGrade = "LIKE_NEW";
  else if (/excellent/.test(lower)) conditionGrade = "EXCELLENT";
  else if (/\bgood\b/.test(lower)) conditionGrade = "GOOD";
  else if (/\bfair\b/.test(lower)) conditionGrade = "FAIR";
  else if (/poor|damaged/.test(lower)) conditionGrade = "POOR";

  const cleanedQuery = q
    .replace(/(?:under|below|less than)\s*(?:rs\.?|₹)?\s*[\d,]+/gi, "")
    .replace(/(?:between|from)\s*(?:rs\.?|₹)?\s*[\d,]+\s*(?:to|-|and)\s*(?:rs\.?|₹)?\s*[\d,]+/gi, "")
    .replace(new RegExp(`\\b(${CITY_HINTS.join("|")})\\b`, "gi"), "")
    .trim();

  return {
    query: cleanedQuery || q,
    categorySlug: category?.slug,
    minPriceInr,
    maxPriceInr,
    city: city === "bangalore" ? "Bengaluru" : city ? city[0]!.toUpperCase() + city.slice(1) : undefined,
    conditionGrade,
    sort: /cheapest|lowest price/.test(lower)
      ? "price_asc"
      : /newest|latest/.test(lower)
        ? "newest"
        : "relevance",
  };
}

function fromAi(data: SearchFiltersAi): SearchFilters {
  return {
    query: data.query,
    categorySlug: data.categorySlug ?? undefined,
    minPriceInr: data.minPriceInr ?? undefined,
    maxPriceInr: data.maxPriceInr ?? undefined,
    city: data.city ?? undefined,
    state: data.state ?? undefined,
    conditionGrade: data.conditionGrade ?? undefined,
    sort: data.sort,
  };
}

export async function parseNaturalLanguageQuery(query: string): Promise<SearchFilters> {
  const fallback = heuristicParse(query);
  try {
    const ai = getAIService();
    const parsed = await ai.parseSearch(query);
    const merged: SearchFilters = {
      ...fallback,
      ...Object.fromEntries(
        Object.entries(fromAi(parsed)).filter(([, v]) => v !== undefined && v !== null && v !== ""),
      ),
      query: parsed.query || fallback.query,
    };
    return merged;
  } catch {
    return fallback;
  }
}
