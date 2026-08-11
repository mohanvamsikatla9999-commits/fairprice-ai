import type { AIGenerateOptions, AIProvider, AIResult, ChatMessage } from "./types";

function extractPrompt(messages: ChatMessage[], fallback: string): string {
  const user = [...messages].reverse().find((m) => m.role === "user");
  const system = messages.find((m) => m.role === "system");
  return `${system?.content ?? ""}\n${user?.content ?? fallback}`.toLowerCase();
}

function hashSeed(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h * 31 + input.charCodeAt(i)) >>> 0;
  }
  return h;
}

function pickPrice(seed: number, base = 25_000): number {
  return base + (seed % 15_000);
}

export class MockAIProvider implements AIProvider {
  readonly name = "mock";

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async chat(
    messages: ChatMessage[],
    options?: AIGenerateOptions,
  ): Promise<AIResult> {
    const prompt = extractPrompt(messages, "");
    const seed = hashSeed(prompt);
    const content = this.buildResponse(prompt, seed);
    return {
      content,
      model: options?.model ?? "mock-ai-v1",
      provider: this.name,
    };
  }

  async complete(prompt: string, options?: AIGenerateOptions): Promise<AIResult> {
    return this.chat([{ role: "user", content: prompt }], options);
  }

  private buildResponse(prompt: string, seed: number): string {
    if (/(valuat|fair.?value|price.?estimate|worth)/.test(prompt)) {
      const mid = pickPrice(seed);
      return JSON.stringify({
        fairValueMinInr: Math.round(mid * 0.88),
        fairValueMaxInr: Math.round(mid * 1.12),
        fairValueMidInr: mid,
        recommendedListingInr: Math.round(mid * 1.05),
        expectedSaleMinInr: Math.round(mid * 0.9),
        expectedSaleMaxInr: Math.round(mid * 1.08),
        quickSaleInr: Math.round(mid * 0.85),
        confidence: 0.72,
        verdict: "FAIR",
        explanation:
          "Based on similar recent listings, this price sits near the market mid-point for the stated condition and location.",
        factors: [
          { name: "Condition", impactPct: -8, description: "Good condition adjustment" },
          { name: "Age", impactPct: -12, description: "Age-based depreciation" },
          { name: "Demand", impactPct: 5, description: "Healthy local demand" },
        ],
      });
    }

    if (/(condition|damage|scratch|wear)/.test(prompt)) {
      return JSON.stringify({
        score: 72,
        grade: "GOOD",
        confidence: 0.8,
        visibleDamage: ["minor scratches on back"],
        scratches: "light",
        dents: "none",
        cracks: "none",
        screenCondition: "good",
        bodyCondition: "good",
        wear: "normal",
        missingAccessories: [],
        cleanliness: "clean",
        modifications: "none",
        suspiciousPatterns: [],
        explanation: "Overall good condition with light cosmetic wear only.",
        insufficientQuality: false,
      });
    }

    if (/(fraud|scam|risk|suspicious)/.test(prompt)) {
      return JSON.stringify({
        score: 28,
        level: "LOW",
        summary: "No strong fraud indicators detected in the provided signals.",
        signals: [
          { signalType: "price_anomaly", weight: 10, evidence: { note: "Within expected range" } },
          { signalType: "account_age", weight: 5, evidence: { note: "Account looks established" } },
        ],
        recommendations: ["Prefer in-person handover at a public place"],
      });
    }

    if (/(search|filter|query|find listings)/.test(prompt)) {
      return JSON.stringify({
        query: "iphone",
        categorySlug: "mobiles",
        minPriceInr: 20_000,
        maxPriceInr: 60_000,
        city: "Bengaluru",
        conditionGrade: "GOOD",
        sort: "relevance",
        keywords: ["iphone", "128gb"],
      });
    }

    if (/(negotiat|offer|counter)/.test(prompt)) {
      const ask = pickPrice(seed, 30_000);
      return JSON.stringify({
        suggestedOfferInr: Math.round(ask * 0.9),
        walkAwayInr: Math.round(ask * 0.82),
        stretchInr: Math.round(ask * 0.95),
        strategy:
          "Open 8–12% below asking, cite comparable sold prices, and keep a polite firm ceiling.",
        talkingPoints: [
          "Recent similar units sold lower",
          "Missing original box reduces urgency",
          "Cash-ready buyer can close today",
        ],
      });
    }

    if (/(listing|title|description|rewrite)/.test(prompt)) {
      return JSON.stringify({
        title: "Well-maintained item ready for a fair local sale",
        description:
          "Clean, carefully used item with honest condition notes. Priced using FairPrice AI market comps. Serious buyers welcome for inspection.",
        tags: ["fair-price", "local-pickup", "inspected"],
        suggestedPriceInr: pickPrice(seed),
      });
    }

    if (/(support|help|ticket|faq)/.test(prompt)) {
      return JSON.stringify({
        reply:
          "Thanks for reaching out to FairPrice AI support. Share your order or listing ID and we will help you resolve this quickly.",
        suggestedActions: ["Check FAQ", "Open a support ticket", "Review safety tips"],
        escalate: false,
      });
    }

    if (/(identif|product identification|seller hint|visible logos)/.test(prompt)) {
      const poco = /poco\s*m\s*7/.test(prompt);
      return JSON.stringify({
        brand: poco ? "POCO" : "Unknown",
        model: poco ? "M7" : "Unknown",
        productLabel: poco ? "POCO M7" : "Unknown device",
        categorySlug: "mobiles",
        estimatedMsrpInr: poco ? 12499 : null,
        confidence: poco ? 0.86 : 0.35,
        storage: poco ? "128GB" : null,
        color: null,
        notes: poco
          ? "Matched budget POCO M7 from seller hint/catalog cues."
          : "Could not confidently identify model from available signals.",
        insufficientQuality: !poco,
      });
    }

    return JSON.stringify({
      content:
        "Mock AI response. Configure Ollama or set AI_PROVIDER=ollama for live generation.",
      confidence: 0.5,
    });
  }
}
