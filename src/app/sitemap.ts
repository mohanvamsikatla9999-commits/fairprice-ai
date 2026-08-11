import type { MetadataRoute } from "next";
import { env } from "@/config/env";
import { categories } from "@/config/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = env.APP_URL.replace(/\/$/, "");
  const staticRoutes = [
    "",
    "/marketplace",
    "/search",
    "/sell",
    "/value",
    "/ai-price-check",
    "/how-it-works",
    "/safety",
    "/trust",
    "/about",
    "/careers",
    "/blog",
    "/help",
    "/contact",
    "/pricing",
    "/for-business",
    "/developers",
    "/developer",
    "/terms",
    "/privacy",
    "/cookies",
    "/refund-policy",
    "/community-guidelines",
    "/safety-guidelines",
    "/accessibility",
  ];
  return [
    ...staticRoutes.map((route) => ({
      url: `${base}${route || "/"}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: route === "" ? 1 : 0.7,
    })),
    ...categories.map((c) => ({
      url: `${base}/category/${c.slug}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.6,
    })),
  ];
}
