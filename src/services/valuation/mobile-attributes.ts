import { z } from "zod";
import type { ValuationFactor } from "./model";

/**
 * Dynamic mobile listing attributes used in sell wizard + valuation.
 * Keys match CategoryAttribute / ListingAttribute.
 */
export const MOBILE_SELL_ATTRIBUTE_DEFS = [
  {
    key: "storage",
    label: "Storage",
    type: "SELECT" as const,
    options: ["32GB", "64GB", "128GB", "256GB", "512GB", "1TB"],
    required: true,
    helpText: "Internal storage of your phone",
  },
  {
    key: "ram",
    label: "RAM",
    type: "SELECT" as const,
    options: ["2GB", "3GB", "4GB", "6GB", "8GB", "12GB", "16GB"],
    required: true,
  },
  {
    key: "color",
    label: "Colour",
    type: "TEXT" as const,
    required: false,
  },
  {
    key: "network",
    label: "Network",
    type: "SELECT" as const,
    options: ["4G", "5G"],
    required: false,
  },
  {
    key: "ageMonths",
    label: "Age (months)",
    type: "NUMBER" as const,
    required: true,
    helpText: "How old is the phone since purchase?",
  },
  {
    key: "batteryHealth",
    label: "Battery health (%)",
    type: "NUMBER" as const,
    required: false,
    helpText: "iPhone Settings → Battery, or estimate for Android",
  },
  {
    key: "screenCondition",
    label: "Screen condition",
    type: "SELECT" as const,
    options: ["Perfect", "Minor scratches", "Visible scratches", "Cracked / damaged"],
    required: true,
  },
  {
    key: "bodyCondition",
    label: "Body condition",
    type: "SELECT" as const,
    options: ["Perfect", "Minor marks", "Dents / scuffs", "Heavy wear"],
    required: true,
  },
  {
    key: "boxAvailable",
    label: "Original box",
    type: "BOOLEAN" as const,
    required: true,
  },
  {
    key: "chargerAvailable",
    label: "Original charger",
    type: "BOOLEAN" as const,
    required: true,
  },
  {
    key: "earphonesAvailable",
    label: "Earphones / accessories",
    type: "BOOLEAN" as const,
    required: false,
  },
  {
    key: "invoiceAvailable",
    label: "Purchase invoice / bill",
    type: "BOOLEAN" as const,
    required: true,
  },
  {
    key: "warranty",
    label: "Warranty status",
    type: "SELECT" as const,
    options: ["No warranty", "Manufacturer warranty left", "Extended warranty", "Brand care / insured"],
    required: true,
  },
  {
    key: "warrantyMonthsLeft",
    label: "Warranty months left",
    type: "NUMBER" as const,
    required: false,
  },
  {
    key: "repairHistory",
    label: "Repair history",
    type: "SELECT" as const,
    options: ["Never repaired", "Minor repair", "Screen replaced", "Battery replaced", "Major repair"],
    required: true,
  },
  {
    key: "imeiVerified",
    label: "IMEI / authenticity checked",
    type: "BOOLEAN" as const,
    required: false,
  },
  {
    key: "purchasedFrom",
    label: "Purchased from",
    type: "SELECT" as const,
    options: ["Official store", "Amazon / Flipkart", "Local retailer", "Other"],
    required: false,
  },
] as const;

export type MobileSellAttributes = {
  storage?: string;
  ram?: string;
  color?: string;
  network?: string;
  ageMonths?: number;
  batteryHealth?: number;
  screenCondition?: string;
  bodyCondition?: string;
  boxAvailable?: boolean;
  chargerAvailable?: boolean;
  earphonesAvailable?: boolean;
  invoiceAvailable?: boolean;
  warranty?: string;
  warrantyMonthsLeft?: number;
  repairHistory?: string;
  imeiVerified?: boolean;
  purchasedFrom?: string;
};

export const mobileSellAttributesSchema = z.object({
  storage: z.string().optional(),
  ram: z.string().optional(),
  color: z.string().optional(),
  network: z.string().optional(),
  ageMonths: z.number().int().min(0).max(120).optional(),
  batteryHealth: z.number().min(0).max(100).optional(),
  screenCondition: z.string().optional(),
  bodyCondition: z.string().optional(),
  boxAvailable: z.boolean().optional(),
  chargerAvailable: z.boolean().optional(),
  earphonesAvailable: z.boolean().optional(),
  invoiceAvailable: z.boolean().optional(),
  warranty: z.string().optional(),
  warrantyMonthsLeft: z.number().int().min(0).max(36).optional(),
  repairHistory: z.string().optional(),
  imeiVerified: z.boolean().optional(),
  purchasedFrom: z.string().optional(),
});

/**
 * Deterministic INR adjustments from accessories / condition details.
 * Returns multiplier (~0.75–1.12) and explainable factors.
 */
export function computeMobileAttributeAdjustment(
  attrs: MobileSellAttributes,
  baseValueInr: number,
): { multiplier: number; factors: ValuationFactor[] } {
  const factors: ValuationFactor[] = [];
  let mult = 1;

  const bump = (name: string, pct: number, description: string) => {
    if (pct === 0) return;
    mult *= 1 + pct;
    factors.push({
      name,
      impactInr: Math.round(baseValueInr * pct),
      impactPct: Math.round(pct * 1000) / 10,
      description,
    });
  };

  if (attrs.boxAvailable === true) bump("Original box", 0.015, "Original box included");
  if (attrs.boxAvailable === false) bump("No original box", -0.015, "Original box missing");

  if (attrs.chargerAvailable === true) bump("Original charger", 0.02, "Original charger included");
  if (attrs.chargerAvailable === false) bump("No charger", -0.025, "Charger missing");

  if (attrs.invoiceAvailable === true) bump("Invoice available", 0.015, "Bill/invoice available — higher buyer trust");
  if (attrs.invoiceAvailable === false) bump("No invoice", -0.01, "No purchase invoice");

  if (attrs.earphonesAvailable === true) bump("Accessories", 0.005, "Earphones/extra accessories included");

  const warranty = (attrs.warranty ?? "").toLowerCase();
  if (warranty.includes("manufacturer") || warranty.includes("extended") || warranty.includes("insured")) {
    const months = attrs.warrantyMonthsLeft ?? 3;
    const pct = Math.min(0.05, 0.01 + months * 0.004);
    bump("Warranty left", pct, `${attrs.warranty} (~${months} months)`);
  } else if (warranty.includes("no warranty")) {
    bump("No warranty", -0.015, "No remaining warranty");
  }

  if (typeof attrs.batteryHealth === "number") {
    if (attrs.batteryHealth >= 95) bump("Battery excellent", 0.02, `Battery health ${attrs.batteryHealth}%`);
    else if (attrs.batteryHealth >= 85) bump("Battery good", 0.005, `Battery health ${attrs.batteryHealth}%`);
    else if (attrs.batteryHealth >= 80) bump("Battery fair", -0.02, `Battery health ${attrs.batteryHealth}%`);
    else if (attrs.batteryHealth >= 70) bump("Battery worn", -0.05, `Battery health ${attrs.batteryHealth}%`);
    else bump("Battery poor", -0.1, `Battery health ${attrs.batteryHealth}%`);
  }

  const screen = (attrs.screenCondition ?? "").toLowerCase();
  if (screen.includes("cracked") || screen.includes("damaged")) bump("Screen damage", -0.12, attrs.screenCondition!);
  else if (screen.includes("visible")) bump("Screen scratches", -0.04, attrs.screenCondition!);
  else if (screen.includes("minor")) bump("Minor screen wear", -0.015, attrs.screenCondition!);
  else if (screen.includes("perfect")) bump("Perfect screen", 0.01, "Screen in perfect condition");

  const body = (attrs.bodyCondition ?? "").toLowerCase();
  if (body.includes("heavy")) bump("Heavy body wear", -0.06, attrs.bodyCondition!);
  else if (body.includes("dent")) bump("Body dents", -0.035, attrs.bodyCondition!);
  else if (body.includes("minor")) bump("Minor body marks", -0.01, attrs.bodyCondition!);
  else if (body.includes("perfect")) bump("Perfect body", 0.01, "Body in perfect condition");

  const repair = (attrs.repairHistory ?? "").toLowerCase();
  if (repair.includes("major")) bump("Major repair history", -0.08, attrs.repairHistory!);
  else if (repair.includes("screen replaced")) bump("Screen replaced", -0.04, attrs.repairHistory!);
  else if (repair.includes("battery replaced")) bump("Battery replaced", -0.015, "Battery was replaced");
  else if (repair.includes("minor")) bump("Minor repair", -0.02, attrs.repairHistory!);

  if (attrs.imeiVerified === true) bump("IMEI verified", 0.01, "IMEI / authenticity checked");

  // Clamp total accessory swing
  mult = Math.min(1.12, Math.max(0.72, mult));
  return { multiplier: mult, factors };
}

export function attributesToListingRows(
  attrs: MobileSellAttributes,
): Array<{ key: string; value: string }> {
  return Object.entries(attrs)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([key, value]) => ({
      key,
      value: typeof value === "boolean" ? (value ? "true" : "false") : String(value),
    }));
}
