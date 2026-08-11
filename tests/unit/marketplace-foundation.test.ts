import { describe, expect, it } from "vitest";
import { MARKETPLACE_CATEGORY_TREE } from "../../prisma/marketplace-categories";
import { distanceKm, findCityBySlug } from "@/config/india-cities";

describe("marketplace category tree", () => {
  it("includes major root categories", () => {
    const slugs = MARKETPLACE_CATEGORY_TREE.map((c) => c.slug);
    expect(slugs).toEqual(
      expect.arrayContaining([
        "cars",
        "bikes",
        "properties",
        "electronics",
        "mobiles",
        "jobs",
        "furniture",
        "fashion",
        "pets",
        "books-sports-hobbies",
        "services",
      ]),
    );
  });

  it("nests mobile phones under mobiles", () => {
    const mobiles = MARKETPLACE_CATEGORY_TREE.find((c) => c.slug === "mobiles");
    expect(mobiles?.children?.some((c) => c.slug === "mobile-phones")).toBe(true);
  });

  it("defines car filter attributes", () => {
    const cars = MARKETPLACE_CATEGORY_TREE.find((c) => c.slug === "cars");
    expect(cars?.attributes?.some((a) => a.key === "fuel")).toBe(true);
  });
});

describe("india cities areas", () => {
  it("exposes hyderabad areas for locality UI", () => {
    const hyd = findCityBySlug("hyderabad");
    expect(hyd?.areas?.length).toBeGreaterThan(0);
  });

  it("still computes inter-city distance", () => {
    const hyd = findCityBySlug("hyderabad")!;
    const blr = findCityBySlug("bengaluru")!;
    expect(distanceKm(hyd.lat, hyd.lng, blr.lat, blr.lng)).toBeGreaterThan(400);
  });
});
