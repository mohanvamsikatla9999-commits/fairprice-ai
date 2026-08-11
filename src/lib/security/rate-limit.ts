import { env } from "@/config/env";
import { RateLimitError } from "@/lib/api/errors";

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

export type RateLimitOptions = {
  key: string;
  windowMs?: number;
  max?: number;
};

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  limit: number;
};

export function checkRateLimit(options: RateLimitOptions): RateLimitResult {
  const windowMs = options.windowMs ?? env.RATE_LIMIT_WINDOW_MS;
  const max = options.max ?? env.RATE_LIMIT_MAX;
  const now = Date.now();
  const existing = buckets.get(options.key);

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + windowMs;
    buckets.set(options.key, { count: 1, resetAt });
    return {
      allowed: true,
      remaining: Math.max(0, max - 1),
      resetAt,
      limit: max,
    };
  }

  existing.count += 1;
  buckets.set(options.key, existing);
  const allowed = existing.count <= max;
  return {
    allowed,
    remaining: Math.max(0, max - existing.count),
    resetAt: existing.resetAt,
    limit: max,
  };
}

export function enforceRateLimit(options: RateLimitOptions): RateLimitResult {
  const result = checkRateLimit(options);
  if (!result.allowed) {
    throw new RateLimitError("Rate limit exceeded", {
      resetAt: result.resetAt,
      limit: result.limit,
    });
  }
  return result;
}

export function resetRateLimitStore(): void {
  buckets.clear();
}
