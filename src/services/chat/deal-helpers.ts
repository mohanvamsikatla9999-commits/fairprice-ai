import { SAFE_MEETUP_TEMPLATES } from "@/config/india-cities";

export const SELLER_CANNED_REPLIES = [
  "Hi! Thanks for your interest. The item is available.",
  "FairPrice for this is roughly in the suggested band — happy to discuss a fair offer.",
  "We can meet in a public place. I prefer malls or metro stations.",
  "Please inspect the item in person before paying. No OTPs or QR payments.",
  "I can share more photos if you tell me what you'd like to see.",
  "Lowest I can do is close to the FairPrice mid — let's keep it fair for both.",
];

export const BUYER_CANNED_REPLIES = [
  "Hi! Is this still available?",
  "Can we meet today at a public place?",
  "What's your best price if I buy today?",
  "Can you share more photos of the condition?",
  "I'll inspect in person — please don't ask for OTP/advance.",
];

export function meetupSuggestions(city?: string | null): string[] {
  const key = (city ?? "").toLowerCase().replace(/\s+/g, "");
  const matched = Object.entries(SAFE_MEETUP_TEMPLATES).find(([k]) =>
    key.includes(k),
  );
  return matched?.[1] ?? SAFE_MEETUP_TEMPLATES.default;
}

export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 4) return "****";
  return `${"*".repeat(Math.max(0, digits.length - 4))}${digits.slice(-4)}`;
}
