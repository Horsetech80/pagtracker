import { NextRequest } from 'next/server';

// Simple in-memory rate limiter
const requests = new Map<string, { count: number; resetTime: number }>();

export interface RateLimitOptions {
  maxRequests: number;
  windowMs: number;
}

export function rateLimit(options: RateLimitOptions) {
  const { maxRequests, windowMs } = options;

  return function checkRateLimit(request: NextRequest): { success: boolean; limit: number; remaining: number; reset: number } {
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    const now = Date.now();
    const key = `${ip}:${request.nextUrl.pathname}`;

    // Clean up expired entries
    for (const [k, v] of requests.entries()) {
      if (now > v.resetTime) {
        requests.delete(k);
      }
    }

    const current = requests.get(key);
    
    if (!current || now > current.resetTime) {
      // First request or window expired
      requests.set(key, {
        count: 1,
        resetTime: now + windowMs
      });
      
      return {
        success: true,
        limit: maxRequests,
        remaining: maxRequests - 1,
        reset: now + windowMs
      };
    }

    if (current.count >= maxRequests) {
      // Rate limit exceeded
      return {
        success: false,
        limit: maxRequests,
        remaining: 0,
        reset: current.resetTime
      };
    }

    // Increment counter
    current.count++;
    requests.set(key, current);

    return {
      success: true,
      limit: maxRequests,
      remaining: maxRequests - current.count,
      reset: current.resetTime
    };
  };
}

// Default rate limiter for API routes
export const apiRateLimit = rateLimit({
  maxRequests: 100,
  windowMs: 15 * 60 * 1000 // 15 minutes
});

// Strict rate limiter for sensitive operations
export const strictRateLimit = rateLimit({
  maxRequests: 10,
  windowMs: 60 * 1000 // 1 minute
});