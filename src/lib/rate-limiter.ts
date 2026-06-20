/**
 * Simple in-memory rate limiter.
 * For production, consider using Redis (e.g., Upstash, ioredis).
 *
 * Limits:
 * - 100 requests/hour per client (IP or user ID)
 * - Sliding window
 */

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up old entries every 5 minutes to prevent memory leak
setInterval(() => {
  const now = Date.now();
  rateLimitStore.forEach((entry, key) => {
    if (now - entry.windowStart > 3600_000) {
      rateLimitStore.delete(key);
    }
  });
}, 300_000);

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfter?: number;
}

export function checkRateLimit(
  clientId: string,
  maxRequests: number = 100,
  windowSeconds: number = 3600,
): RateLimitResult {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const entry = rateLimitStore.get(clientId);

  if (!entry) {
    // First request in window
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetAt: now + windowMs,
    };
  }

  // Reset window if expired
  if (now - entry.windowStart > windowMs) {
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetAt: now + windowMs,
    };
  }

  // Check limit
  if (entry.count >= maxRequests) {
    const resetAt = entry.windowStart + windowMs;
    return {
      allowed: false,
      remaining: 0,
      resetAt,
      retryAfter: Math.ceil((resetAt - now) / 1000),
    };
  }

  return {
    allowed: true,
    remaining: maxRequests - entry.count - 1,
    resetAt: entry.windowStart + windowMs,
  };
}

export function recordRequest(clientId: string): void {
  const now = Date.now();
  const entry = rateLimitStore.get(clientId);

  if (!entry || now - entry.windowStart > 3600_000) {
    rateLimitStore.set(clientId, { count: 1, windowStart: now });
  } else {
    entry.count++;
  }
}
