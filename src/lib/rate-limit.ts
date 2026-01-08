/**
 * Simple in-memory rate limiter
 * For production, consider using Redis or a dedicated rate limiting service
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store for rate limiting
const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Clean up every minute

export interface RateLimitConfig {
  /** Maximum number of requests allowed in the window */
  maxRequests: number;
  /** Time window in milliseconds */
  windowMs: number;
}

export interface RateLimitResult {
  /** Whether the request is allowed */
  success: boolean;
  /** Number of remaining requests in the window */
  remaining: number;
  /** Time in milliseconds until the rate limit resets */
  resetIn: number;
}

/**
 * Check if a request is rate limited
 * @param key - Unique identifier for the rate limit (e.g., IP address, user ID)
 * @param config - Rate limit configuration
 * @returns Rate limit result
 */
export function checkRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  // If no entry exists or the window has passed, create a new entry
  if (!entry || entry.resetTime < now) {
    const newEntry: RateLimitEntry = {
      count: 1,
      resetTime: now + config.windowMs,
    };
    rateLimitStore.set(key, newEntry);
    return {
      success: true,
      remaining: config.maxRequests - 1,
      resetIn: config.windowMs,
    };
  }

  // Check if the request count exceeds the limit
  if (entry.count >= config.maxRequests) {
    return {
      success: false,
      remaining: 0,
      resetIn: entry.resetTime - now,
    };
  }

  // Increment the count and return success
  entry.count++;
  return {
    success: true,
    remaining: config.maxRequests - entry.count,
    resetIn: entry.resetTime - now,
  };
}

// Helper to safely get IP address
export function getIP(req: Request | any): string { // any for NextRequest compatibility
  const xForwardedFor = req.headers.get('x-forwarded-for');
  const xRealIp = req.headers.get('x-real-ip');

  // Platform specific headers (Vercel)
  if (xRealIp) return xRealIp;

  if (xForwardedFor) {
    const list = xForwardedFor.split(',');
    return list[0]?.trim() || 'unknown';
  }

  // Fallback but prioritize headers which are set by the platform proxy
  return 'unknown';
}

// Pre-configured rate limiters for common use cases
export const rateLimiters = {
  /** Login attempts: 5 requests per minute */
  login: (key: string) => checkRateLimit(`login:${key}`, {
    maxRequests: 5,
    windowMs: 60 * 1000, // 1 minute
  }),

  /** API requests: 100 requests per minute */
  api: (key: string) => checkRateLimit(`api:${key}`, {
    maxRequests: 100,
    windowMs: 60 * 1000, // 1 minute
  }),

  /** Sensitive API (Uploads/Emails): 10 requests per minute */
  sensitive: (key: string) => checkRateLimit(`sensitive:${key}`, {
    maxRequests: 10,
    windowMs: 60 * 1000, // 1 minute
  }),

  /** Password reset: 3 requests per hour */
  passwordReset: (key: string) => checkRateLimit(`pwd-reset:${key}`, {
    maxRequests: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
  }),
};
