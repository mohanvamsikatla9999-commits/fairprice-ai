const DANGEROUS_TAGS =
  /<\/?(script|iframe|object|embed|link|meta|style|form|input|button|textarea|select)[^>]*>/gi;

const EVENT_HANDLERS = /\son[a-z]+\s*=\s*(['"]).*?\1/gi;
const JS_URLS = /(href|src)\s*=\s*(['"])\s*javascript:[^'"]*\2/gi;

export function stripDangerousHtml(input: string): string {
  return input
    .replace(DANGEROUS_TAGS, "")
    .replace(EVENT_HANDLERS, "")
    .replace(JS_URLS, '$1=""')
    .replace(/[<>]/g, (ch) => {
      if (ch === "<") return "&lt;";
      if (ch === ">") return "&gt;";
      return ch;
    });
}

export function sanitizeText(input: string, maxLength = 10_000): string {
  return input.replace(/\0/g, "").trim().slice(0, maxLength);
}

export function sanitizeFilename(input: string): string {
  const base = input.split(/[/\\]/).pop() ?? "file";
  const cleaned = base
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^\.+/, "")
    .replace(/-+/g, "-")
    .slice(0, 180);
  return cleaned || "file";
}

export function sanitizeSlugPart(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
