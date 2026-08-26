import type { ProductIdentity } from "./schemas";

export type CriticalAttribute = {
  key: string;
  question: string;
  materiality: "critical" | "helpful";
};

function hasAttr(
  attrs: Record<string, string | number | boolean> | undefined,
  ...keys: string[]
): boolean {
  if (!attrs) return false;
  return keys.some((k) => attrs[k] !== undefined && attrs[k] !== null && attrs[k] !== "");
}

/**
 * Only attributes that materially improve valuation.
 * Cap questions at 4 in callers.
 */
export function getMissingCriticalAttributes(input: {
  categorySlug?: string | null;
  identity: Pick<ProductIdentity, "brand" | "model" | "storage" | "variant">;
  attributes?: Record<string, string | number | boolean>;
  conditionGrade?: string;
  ageMonths?: number;
  city?: string;
}): CriticalAttribute[] {
  const slug = (input.categorySlug ?? "").toLowerCase();
  const missing: CriticalAttribute[] = [];
  const attrs = input.attributes;

  if (!input.identity.brand || !input.identity.model) {
    missing.push({
      key: "brand_model",
      question: "What is the exact brand and model?",
      materiality: "critical",
    });
  }

  const isMobile =
    slug === "mobiles" || slug === "mobile-phones" || slug.includes("mobile");
  const isLaptop = slug.includes("laptop") || slug.includes("computer");
  const isCar = slug === "cars" || slug.includes("car");
  const isBike = slug === "bikes" || slug.includes("bike") || slug.includes("scooter");
  const isProperty =
    slug === "properties" || slug.startsWith("property-") || slug.includes("lands");
  const isFurniture = slug.includes("furniture");
  const isCamera = slug.includes("camera");
  const isTv = slug.includes("tv") || slug.includes("television");

  if (isMobile) {
    if (!input.identity.storage && !hasAttr(attrs, "storage")) {
      missing.push({
        key: "storage",
        question: "What storage variant is this (e.g. 128GB / 256GB)?",
        materiality: "critical",
      });
    }
    if (!hasAttr(attrs, "batteryHealth")) {
      missing.push({
        key: "batteryHealth",
        question: "What is the battery health percentage?",
        materiality: "critical",
      });
    }
    if (!input.conditionGrade) {
      missing.push({
        key: "condition",
        question: "What is the overall condition?",
        materiality: "critical",
      });
    }
    if (!hasAttr(attrs, "repairHistory")) {
      missing.push({
        key: "repairHistory",
        question: "Has this device ever been repaired?",
        materiality: "helpful",
      });
    }
  }

  if (isLaptop) {
    if (!hasAttr(attrs, "ram", "RAM")) {
      missing.push({
        key: "ram",
        question: "How much RAM does it have?",
        materiality: "critical",
      });
    }
    if (!hasAttr(attrs, "storage")) {
      missing.push({
        key: "storage",
        question: "What storage size (SSD/HDD)?",
        materiality: "critical",
      });
    }
  }

  if (isCar || isBike) {
    if (!hasAttr(attrs, "year", "registrationYear", "manufacturingYear") && input.ageMonths == null) {
      missing.push({
        key: "year",
        question: "What is the manufacture / registration year?",
        materiality: "critical",
      });
    }
    if (!hasAttr(attrs, "km_driven", "kmDriven", "odometer")) {
      missing.push({
        key: "odometer",
        question: "How many kilometres has it run?",
        materiality: "critical",
      });
    }
    if (isCar && !hasAttr(attrs, "fuel", "fuelType")) {
      missing.push({
        key: "fuel",
        question: "What is the fuel type (petrol / diesel / CNG / EV)?",
        materiality: "critical",
      });
    }
    if (isCar && !hasAttr(attrs, "transmission")) {
      missing.push({
        key: "transmission",
        question: "Is it manual or automatic?",
        materiality: "helpful",
      });
    }
    if (!input.identity.variant && !hasAttr(attrs, "variant")) {
      missing.push({
        key: "variant",
        question: "What is the exact variant / trim?",
        materiality: "critical",
      });
    }
  }

  if (isProperty) {
    if (!input.city) {
      missing.push({
        key: "city",
        question: "Which city is the property in?",
        materiality: "critical",
      });
    }
    if (!hasAttr(attrs, "locality", "area", "areaSqft", "builtUpArea")) {
      missing.push({
        key: "area",
        question: "What is the locality and built-up area (sq ft)?",
        materiality: "critical",
      });
    }
    if (!hasAttr(attrs, "propertyType", "bhk", "bedrooms")) {
      missing.push({
        key: "propertyType",
        question: "What is the property type / BHK?",
        materiality: "critical",
      });
    }
  }

  if (isFurniture && !hasAttr(attrs, "material")) {
    missing.push({
      key: "material",
      question: "What material is it (solid wood, engineered, metal, etc.)?",
      materiality: "helpful",
    });
  }

  if (isCamera && !hasAttr(attrs, "shutterCount")) {
    missing.push({
      key: "shutterCount",
      question: "What is the shutter count (if known)?",
      materiality: "helpful",
    });
  }

  if (isTv && !hasAttr(attrs, "screenSize", "size")) {
    missing.push({
      key: "screenSize",
      question: "What is the screen size in inches?",
      materiality: "critical",
    });
  }

  return missing;
}

export function questionsFromMissing(missing: CriticalAttribute[], limit = 4): string[] {
  const critical = missing.filter((m) => m.materiality === "critical");
  const helpful = missing.filter((m) => m.materiality === "helpful");
  return [...critical, ...helpful].slice(0, limit).map((m) => m.question);
}
