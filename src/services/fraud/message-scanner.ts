export type MessageScanResult = {
  riskScore: number;
  flags: string[];
  warning: string | null;
  matchedPatterns: Array<{ id: string; weight: number; excerpt: string }>;
};

type Pattern = {
  id: string;
  weight: number;
  regex: RegExp;
  warning: string;
};

const PATTERNS: Pattern[] = [
  {
    id: "advance_payment",
    weight: 28,
    regex: /\b(pay\s*advance|booking\s*amount|token\s*amount|send\s*money\s*first)\b/i,
    warning: "Requests for advance payment are a common scam pattern.",
  },
  {
    id: "gift_card",
    weight: 35,
    regex: /\b(gift\s*card|steam\s*card|google\s*play\s*card|amazon\s*pay\s*code)\b/i,
    warning: "Gift-card payments are a strong fraud indicator.",
  },
  {
    id: "otp_ask",
    weight: 40,
    regex: /\b(share\s*(the\s*)?otp|send\s*(the\s*)?otp|one[- ]time\s*password)\b/i,
    warning: "Never share OTPs. FairPrice AI staff will never ask for them.",
  },
  {
    id: "upi_pin",
    weight: 42,
    regex: /\b(upi\s*pin|enter\s*(your\s*)?pin|share\s*(your\s*)?(upi\s*)?pin)\b/i,
    warning: "Never share your UPI PIN. Banks and FairPrice AI will never ask for it.",
  },
  {
    id: "qr_code",
    weight: 36,
    regex: /\b(scan\s*(this\s*)?qr|qr\s*code|scan\s*and\s*pay)\b/i,
    warning: "Do not scan unknown QR codes — they can redirect payments to scammers.",
  },
  {
    id: "off_platform",
    weight: 18,
    regex: /\b(whatsapp|telegram|signal|mail\s*me|email\s*me\s*at)\b/i,
    warning: "Be cautious moving chats off-platform before meeting.",
  },
  {
    id: "courier_scam",
    weight: 30,
    regex: /\b(courier\s*will\s*(come|collect)|send\s*via\s*courier\s*with\s*payment)\b/i,
    warning: "Courier-collection payment stories are frequently fraudulent.",
  },
  {
    id: "phishing_link",
    weight: 32,
    regex: /https?:\/\/[^\s]+/i,
    warning: "Unexpected links can be phishing. Verify before clicking.",
  },
  {
    id: "urgency",
    weight: 12,
    regex: /\b(today\s*only|last\s*chance|urgent(ly)?|leaving\s*(city|country)\s*tonight)\b/i,
    warning: "High-pressure urgency language can indicate a scam.",
  },
  {
    id: "bank_details",
    weight: 22,
    regex: /\b(account\s*number|ifsc|upi\s*id\s*is|pay\s*to\s*this\s*upi)\b/i,
    warning: "Verify payment details carefully during in-person deals only.",
  },
];

export function scanMessage(body: string, context?: {
  isFirstMessage?: boolean;
  listingPriceInr?: number;
}): MessageScanResult {
  const text = body ?? "";
  const matched: MessageScanResult["matchedPatterns"] = [];
  const flags: string[] = [];

  for (const pattern of PATTERNS) {
    const m = text.match(pattern.regex);
    if (!m) continue;
    let weight = pattern.weight;
    // Contextual scoring
    if (pattern.id === "off_platform" && context?.isFirstMessage) weight += 8;
    if (pattern.id === "phishing_link" && /bit\.ly|tinyurl|t\.me\//i.test(text)) {
      weight += 10;
    }
    if (
      pattern.id === "advance_payment" &&
      (context?.listingPriceInr ?? 0) > 50_000
    ) {
      weight += 6;
    }
    matched.push({
      id: pattern.id,
      weight,
      excerpt: m[0]!.slice(0, 80),
    });
    flags.push(pattern.id);
  }

  const riskScore = Math.min(
    100,
    matched.reduce((sum, m) => sum + m.weight, 0),
  );

  const top = matched.sort((a, b) => b.weight - a.weight)[0];
  const warning =
    riskScore >= 20 && top
      ? PATTERNS.find((p) => p.id === top.id)?.warning ??
        "This message has potential safety concerns."
      : null;

  return {
    riskScore,
    flags,
    warning,
    matchedPatterns: matched,
  };
}
