export type CatalogProduct = {
  brand: string;
  model: string;
  slug: string;
  categorySlug: string;
  aliases: string[];
  msrpInr: number;
  variants?: Array<{ name: string; msrpInr: number; storage?: string; ram?: string }>;
};
