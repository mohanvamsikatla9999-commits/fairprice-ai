export type Locale = "en" | "hi";

const dict = {
  en: {
    sell: "Sell",
    marketplace: "Marketplace",
    login: "Sign in",
    searchPlaceholder: "What are you looking for?",
    knowWorth: "Know What It's Worth.",
    browseNearYou: "Browse near you",
    continuePhone: "Continue with phone",
  },
  hi: {
    sell: "बेचें",
    marketplace: "बाज़ार",
    login: "साइन इन",
    searchPlaceholder: "आप क्या ढूंढ रहे हैं?",
    knowWorth: "जानें असली कीमत।",
    browseNearYou: "अपने पास देखें",
    continuePhone: "फ़ोन से जारी रखें",
  },
} as const;

export type DictKey = keyof typeof dict.en;

export function t(locale: Locale, key: DictKey): string {
  return dict[locale][key] ?? dict.en[key];
}

export function getStoredLocale(): Locale {
  if (typeof window === "undefined") return "en";
  const v = localStorage.getItem("fp_lang");
  return v === "hi" ? "hi" : "en";
}

export function setStoredLocale(locale: Locale) {
  if (typeof window === "undefined") return;
  localStorage.setItem("fp_lang", locale);
  document.documentElement.lang = locale === "hi" ? "hi" : "en";
}
