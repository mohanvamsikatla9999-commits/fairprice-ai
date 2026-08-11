/**
 * Evaluation dataset format for FairPrice accuracy measurement.
 *
 * ASKING_PRICE_DATASET: curated market observations (asking prices).
 * Do NOT claim these as transaction truth.
 * TRANSACTION_PRICE_DATASET: reserved for real sold prices when available.
 */

export type EvaluationEvidenceKind = "ASKING_PRICE_DATASET" | "TRANSACTION_PRICE_DATASET";

export type EvaluationRecord = {
  id: string;
  category: string;
  brand: string;
  model: string;
  variant?: string;
  condition: "LIKE_NEW" | "EXCELLENT" | "GOOD" | "FAIR" | "POOR";
  location: string;
  /** Observed market price (INR). Meaning depends on evidenceKind. */
  actualPrice: number;
  evidenceKind: EvaluationEvidenceKind;
  notes?: string;
  ageMonths?: number;
  attributes?: Record<string, string | number | boolean>;
};

/**
 * 50 curated India resale ASK observations for algorithm testing / calibration.
 * Labeled ASKING_PRICE_DATASET — not claimed as transaction accuracy.
 */
export const ASKING_PRICE_EVALUATION_SET: EvaluationRecord[] = [
  { id: "m01", category: "mobile", brand: "Apple", model: "iPhone 15", variant: "128GB", condition: "GOOD", location: "Hyderabad", actualPrice: 43000, evidenceKind: "ASKING_PRICE_DATASET", ageMonths: 10 },
  { id: "m02", category: "mobile", brand: "Apple", model: "iPhone 15", variant: "256GB", condition: "GOOD", location: "Bengaluru", actualPrice: 48000, evidenceKind: "ASKING_PRICE_DATASET", ageMonths: 8 },
  { id: "m03", category: "mobile", brand: "Apple", model: "iPhone 15 Pro", variant: "256GB", condition: "EXCELLENT", location: "Mumbai", actualPrice: 72000, evidenceKind: "ASKING_PRICE_DATASET", ageMonths: 6 },
  { id: "m04", category: "mobile", brand: "Apple", model: "iPhone 14", variant: "128GB", condition: "GOOD", location: "Delhi", actualPrice: 34000, evidenceKind: "ASKING_PRICE_DATASET", ageMonths: 18 },
  { id: "m05", category: "mobile", brand: "Apple", model: "iPhone 13", variant: "128GB", condition: "GOOD", location: "Chennai", actualPrice: 28000, evidenceKind: "ASKING_PRICE_DATASET", ageMonths: 24 },
  { id: "m06", category: "mobile", brand: "Samsung", model: "Galaxy S24", variant: "128GB", condition: "GOOD", location: "Hyderabad", actualPrice: 42000, evidenceKind: "ASKING_PRICE_DATASET", ageMonths: 8 },
  { id: "m07", category: "mobile", brand: "Samsung", model: "Galaxy S23", variant: "256GB", condition: "GOOD", location: "Pune", actualPrice: 36000, evidenceKind: "ASKING_PRICE_DATASET", ageMonths: 14 },
  { id: "m08", category: "mobile", brand: "Samsung", model: "Galaxy A54", variant: "128GB", condition: "GOOD", location: "Bengaluru", actualPrice: 16000, evidenceKind: "ASKING_PRICE_DATASET", ageMonths: 12 },
  { id: "m09", category: "mobile", brand: "OnePlus", model: "12", variant: "256GB", condition: "EXCELLENT", location: "Mumbai", actualPrice: 38000, evidenceKind: "ASKING_PRICE_DATASET", ageMonths: 7 },
  { id: "m10", category: "mobile", brand: "OnePlus", model: "Nord CE 3", variant: "128GB", condition: "GOOD", location: "Delhi", actualPrice: 14000, evidenceKind: "ASKING_PRICE_DATASET", ageMonths: 14 },
  { id: "m11", category: "mobile", brand: "Xiaomi", model: "14", variant: "256GB", condition: "GOOD", location: "Hyderabad", actualPrice: 32000, evidenceKind: "ASKING_PRICE_DATASET", ageMonths: 9 },
  { id: "m12", category: "mobile", brand: "Google", model: "Pixel 8", variant: "128GB", condition: "GOOD", location: "Bengaluru", actualPrice: 35000, evidenceKind: "ASKING_PRICE_DATASET", ageMonths: 10 },
  { id: "m13", category: "mobile", brand: "Apple", model: "iPhone 15", variant: "128GB", condition: "FAIR", location: "Kolkata", actualPrice: 39000, evidenceKind: "ASKING_PRICE_DATASET", ageMonths: 12 },
  { id: "m14", category: "mobile", brand: "Apple", model: "iPhone 15", variant: "128GB", condition: "LIKE_NEW", location: "Gurugram", actualPrice: 47000, evidenceKind: "ASKING_PRICE_DATASET", ageMonths: 4 },
  { id: "m15", category: "mobile", brand: "Vivo", model: "V29", variant: "128GB", condition: "GOOD", location: "Ahmedabad", actualPrice: 18000, evidenceKind: "ASKING_PRICE_DATASET", ageMonths: 11 },
  { id: "m16", category: "mobile", brand: "Realme", model: "12 Pro", variant: "256GB", condition: "GOOD", location: "Jaipur", actualPrice: 17000, evidenceKind: "ASKING_PRICE_DATASET", ageMonths: 10 },
  { id: "m17", category: "mobile", brand: "Nothing", model: "Phone 2", variant: "256GB", condition: "GOOD", location: "Bengaluru", actualPrice: 26000, evidenceKind: "ASKING_PRICE_DATASET", ageMonths: 12 },
  { id: "m18", category: "mobile", brand: "Apple", model: "iPhone 12", variant: "64GB", condition: "GOOD", location: "Hyderabad", actualPrice: 18000, evidenceKind: "ASKING_PRICE_DATASET", ageMonths: 36 },
  { id: "m19", category: "mobile", brand: "Samsung", model: "Galaxy S24 Ultra", variant: "256GB", condition: "EXCELLENT", location: "Mumbai", actualPrice: 78000, evidenceKind: "ASKING_PRICE_DATASET", ageMonths: 5 },
  { id: "m20", category: "mobile", brand: "Apple", model: "iPhone 15 Plus", variant: "128GB", condition: "GOOD", location: "Chennai", actualPrice: 49000, evidenceKind: "ASKING_PRICE_DATASET", ageMonths: 9 },

  { id: "l01", category: "laptop", brand: "Apple", model: "MacBook Air M2", variant: "8/256", condition: "GOOD", location: "Bengaluru", actualPrice: 72000, evidenceKind: "ASKING_PRICE_DATASET", ageMonths: 14 },
  { id: "l02", category: "laptop", brand: "Apple", model: "MacBook Air M1", variant: "8/256", condition: "GOOD", location: "Delhi", actualPrice: 55000, evidenceKind: "ASKING_PRICE_DATASET", ageMonths: 30 },
  { id: "l03", category: "laptop", brand: "Dell", model: "XPS 13", variant: "16/512", condition: "GOOD", location: "Mumbai", actualPrice: 68000, evidenceKind: "ASKING_PRICE_DATASET", ageMonths: 18 },
  { id: "l04", category: "laptop", brand: "HP", model: "Pavilion 15", variant: "16/512", condition: "GOOD", location: "Hyderabad", actualPrice: 38000, evidenceKind: "ASKING_PRICE_DATASET", ageMonths: 16 },
  { id: "l05", category: "laptop", brand: "Lenovo", model: "ThinkPad E14", variant: "16/512", condition: "EXCELLENT", location: "Pune", actualPrice: 42000, evidenceKind: "ASKING_PRICE_DATASET", ageMonths: 12 },
  { id: "l06", category: "laptop", brand: "ASUS", model: "Vivobook 15", variant: "8/512", condition: "GOOD", location: "Chennai", actualPrice: 28000, evidenceKind: "ASKING_PRICE_DATASET", ageMonths: 14 },
  { id: "l07", category: "laptop", brand: "Apple", model: "MacBook Pro 14 M3", variant: "18/512", condition: "LIKE_NEW", location: "Bengaluru", actualPrice: 145000, evidenceKind: "ASKING_PRICE_DATASET", ageMonths: 6 },

  { id: "t01", category: "tv", brand: "Samsung", model: "Crystal 55", variant: "55inch", condition: "GOOD", location: "Hyderabad", actualPrice: 32000, evidenceKind: "ASKING_PRICE_DATASET", ageMonths: 18 },
  { id: "t02", category: "tv", brand: "LG", model: "OLED C3", variant: "55inch", condition: "EXCELLENT", location: "Mumbai", actualPrice: 85000, evidenceKind: "ASKING_PRICE_DATASET", ageMonths: 12 },
  { id: "t03", category: "tv", brand: "Sony", model: "Bravia 43", variant: "43inch", condition: "GOOD", location: "Delhi", actualPrice: 28000, evidenceKind: "ASKING_PRICE_DATASET", ageMonths: 20 },
  { id: "t04", category: "tv", brand: "Mi", model: "TV 5X", variant: "50inch", condition: "GOOD", location: "Bengaluru", actualPrice: 22000, evidenceKind: "ASKING_PRICE_DATASET", ageMonths: 16 },

  { id: "c01", category: "camera", brand: "Canon", model: "EOS R50", variant: "body", condition: "GOOD", location: "Bengaluru", actualPrice: 48000, evidenceKind: "ASKING_PRICE_DATASET", ageMonths: 12 },
  { id: "c02", category: "camera", brand: "Sony", model: "A6400", variant: "body", condition: "GOOD", location: "Mumbai", actualPrice: 52000, evidenceKind: "ASKING_PRICE_DATASET", ageMonths: 24 },
  { id: "c03", category: "camera", brand: "Nikon", model: "Z50", variant: "kit", condition: "EXCELLENT", location: "Delhi", actualPrice: 55000, evidenceKind: "ASKING_PRICE_DATASET", ageMonths: 14 },
  { id: "c04", category: "camera", brand: "GoPro", model: "Hero 11", variant: "black", condition: "GOOD", location: "Hyderabad", actualPrice: 22000, evidenceKind: "ASKING_PRICE_DATASET", ageMonths: 16 },

  { id: "v01", category: "car", brand: "Maruti", model: "Swift", variant: "VXI", condition: "GOOD", location: "Hyderabad", actualPrice: 450000, evidenceKind: "ASKING_PRICE_DATASET", attributes: { year: 2019, kmDriven: 42000, fuel: "petrol" } },
  { id: "v02", category: "car", brand: "Hyundai", model: "i20", variant: "Sportz", condition: "GOOD", location: "Bengaluru", actualPrice: 580000, evidenceKind: "ASKING_PRICE_DATASET", attributes: { year: 2021, kmDriven: 28000, fuel: "petrol" } },
  { id: "v03", category: "car", brand: "Honda", model: "City", variant: "VX", condition: "EXCELLENT", location: "Mumbai", actualPrice: 920000, evidenceKind: "ASKING_PRICE_DATASET", attributes: { year: 2022, kmDriven: 18000, fuel: "petrol" } },
  { id: "v04", category: "car", brand: "Tata", model: "Nexon", variant: "XZ+", condition: "GOOD", location: "Pune", actualPrice: 780000, evidenceKind: "ASKING_PRICE_DATASET", attributes: { year: 2021, kmDriven: 35000, fuel: "petrol" } },
  { id: "v05", category: "car", brand: "Toyota", model: "Innova Crysta", variant: "GX", condition: "GOOD", location: "Chennai", actualPrice: 1450000, evidenceKind: "ASKING_PRICE_DATASET", attributes: { year: 2020, kmDriven: 55000, fuel: "diesel" } },

  { id: "b01", category: "bike", brand: "Royal Enfield", model: "Classic 350", variant: "ABS", condition: "GOOD", location: "Hyderabad", actualPrice: 145000, evidenceKind: "ASKING_PRICE_DATASET", attributes: { year: 2021, kmDriven: 12000 } },
  { id: "b02", category: "bike", brand: "Honda", model: "Activa 6G", variant: "STD", condition: "GOOD", location: "Bengaluru", actualPrice: 52000, evidenceKind: "ASKING_PRICE_DATASET", attributes: { year: 2022, kmDriven: 8000 } },
  { id: "b03", category: "bike", brand: "TVS", model: "Apache RTR 160", variant: "4V", condition: "GOOD", location: "Delhi", actualPrice: 78000, evidenceKind: "ASKING_PRICE_DATASET", attributes: { year: 2021, kmDriven: 15000 } },
  { id: "b04", category: "bike", brand: "Bajaj", model: "Pulsar 150", variant: "DTSi", condition: "FAIR", location: "Pune", actualPrice: 45000, evidenceKind: "ASKING_PRICE_DATASET", attributes: { year: 2019, kmDriven: 28000 } },
  { id: "b05", category: "bike", brand: "Yamaha", model: "MT-15", variant: "V2", condition: "EXCELLENT", location: "Mumbai", actualPrice: 125000, evidenceKind: "ASKING_PRICE_DATASET", attributes: { year: 2023, kmDriven: 4000 } },

  { id: "f01", category: "furniture", brand: "IKEA", model: "MALM Bed", variant: "Queen", condition: "GOOD", location: "Bengaluru", actualPrice: 12000, evidenceKind: "ASKING_PRICE_DATASET", ageMonths: 24 },
  { id: "f02", category: "furniture", brand: "HomeCentre", model: "Sofa 3-Seater", variant: "Fabric", condition: "GOOD", location: "Hyderabad", actualPrice: 18000, evidenceKind: "ASKING_PRICE_DATASET", ageMonths: 18 },
  { id: "f03", category: "furniture", brand: "Nilkamal", model: "Study Table", variant: "Wood", condition: "FAIR", location: "Delhi", actualPrice: 3500, evidenceKind: "ASKING_PRICE_DATASET", ageMonths: 30 },
  { id: "f04", category: "furniture", brand: "Godrej", model: "Wardrobe", variant: "3-door", condition: "GOOD", location: "Mumbai", actualPrice: 15000, evidenceKind: "ASKING_PRICE_DATASET", ageMonths: 36 },
  { id: "f05", category: "furniture", brand: "Pepperfry", model: "Dining Set", variant: "6-seater", condition: "GOOD", location: "Pune", actualPrice: 22000, evidenceKind: "ASKING_PRICE_DATASET", ageMonths: 20 },
];

export type PredictionResult = {
  recordId: string;
  predictedMid: number | null;
  fairLow: number | null;
  fairHigh: number | null;
  confidence: number;
  status: string;
  category: string;
  actualPrice: number;
  evidenceKind: EvaluationEvidenceKind;
};

export type EvaluationMetrics = {
  n: number;
  mae: number | null;
  mape: number | null;
  medianAbsoluteError: number | null;
  bias: number | null;
  intervalCoverage: number | null;
  meanIntervalWidth: number | null;
  byCategory: Record<
    string,
    {
      n: number;
      mae: number | null;
      mape: number | null;
      medianAbsoluteError: number | null;
      intervalCoverage: number | null;
    }
  >;
  datasetNote: string;
};

function median(values: number[]): number {
  if (!values.length) return 0;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid]! : (s[mid - 1]! + s[mid]!) / 2;
}

/**
 * Compute metrics vs observed prices.
 * Does NOT claim production accuracy when evidenceKind is ASKING_PRICE_DATASET.
 */
export function computeEvaluationMetrics(
  predictions: PredictionResult[],
): EvaluationMetrics {
  const usable = predictions.filter(
    (p) => p.predictedMid != null && p.predictedMid > 0 && p.status === "SUCCESS",
  );
  const absErrors = usable.map((p) => Math.abs(p.predictedMid! - p.actualPrice));
  const pctErrors = usable.map(
    (p) => Math.abs(p.predictedMid! - p.actualPrice) / Math.max(p.actualPrice, 1),
  );
  const biasVals = usable.map((p) => p.predictedMid! - p.actualPrice);
  const withInterval = usable.filter((p) => p.fairLow != null && p.fairHigh != null);
  const covered = withInterval.filter(
    (p) => p.actualPrice >= p.fairLow! && p.actualPrice <= p.fairHigh!,
  );
  const widths = withInterval.map((p) => p.fairHigh! - p.fairLow!);

  const byCategory: EvaluationMetrics["byCategory"] = {};
  for (const p of usable) {
    byCategory[p.category] ??= {
      n: 0,
      mae: null,
      mape: null,
      medianAbsoluteError: null,
      intervalCoverage: null,
    };
  }
  for (const cat of Object.keys(byCategory)) {
    const rows = usable.filter((p) => p.category === cat);
    const ae = rows.map((p) => Math.abs(p.predictedMid! - p.actualPrice));
    const pe = rows.map(
      (p) => Math.abs(p.predictedMid! - p.actualPrice) / Math.max(p.actualPrice, 1),
    );
    const iv = rows.filter((p) => p.fairLow != null && p.fairHigh != null);
    const cov = iv.filter(
      (p) => p.actualPrice >= p.fairLow! && p.actualPrice <= p.fairHigh!,
    );
    byCategory[cat] = {
      n: rows.length,
      mae: ae.length ? ae.reduce((a, b) => a + b, 0) / ae.length : null,
      mape: pe.length ? (pe.reduce((a, b) => a + b, 0) / pe.length) * 100 : null,
      medianAbsoluteError: ae.length ? median(ae) : null,
      intervalCoverage: iv.length ? cov.length / iv.length : null,
    };
  }

  const kinds = new Set(predictions.map((p) => p.evidenceKind));
  const datasetNote = kinds.has("TRANSACTION_PRICE_DATASET")
    ? "Includes transaction-price labels where present."
    : "ASKING_PRICE_DATASET only — metrics measure fit to asking observations, NOT claimed transaction accuracy.";

  return {
    n: usable.length,
    mae: absErrors.length ? absErrors.reduce((a, b) => a + b, 0) / absErrors.length : null,
    mape: pctErrors.length
      ? (pctErrors.reduce((a, b) => a + b, 0) / pctErrors.length) * 100
      : null,
    medianAbsoluteError: absErrors.length ? median(absErrors) : null,
    bias: biasVals.length ? biasVals.reduce((a, b) => a + b, 0) / biasVals.length : null,
    intervalCoverage: withInterval.length ? covered.length / withInterval.length : null,
    meanIntervalWidth: widths.length
      ? widths.reduce((a, b) => a + b, 0) / widths.length
      : null,
    byCategory,
    datasetNote,
  };
}
