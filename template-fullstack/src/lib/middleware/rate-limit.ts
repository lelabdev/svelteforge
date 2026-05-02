/**
 * Rate limiting middleware for SvelteKit
 *
 * Provides in-memory rate limiting to prevent brute force attacks and abuse.
 * For production, consider using Redis-backed rate limiting for distributed systems.
 */

import type { RequestEvent } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';

/**
 * Type for rate limit information
 */
export interface RateLimitInfo {
	limit: number;
	remaining: number;
	reset: Date;
}

interface RateLimitConfig {
	/** Maximum number of requests allowed in the time window */
	maxRequests: number;
	/** Time window in milliseconds */
	windowMs: number;
	/** Whether to skip successful requests from counting against the limit */
	skipSuccessfulRequests?: boolean;
}

interface RateLimitStore {
	count: number;
	resetTime: number;
}

/**
 * Default rate limit configurations for different endpoint types
 */
export const DEFAULT_LIMITS = {
	/** Strict limit for auth endpoints (login, signup, password reset) */
	auth: { maxRequests: 5, windowMs: 15 * 60 * 1000 } as const, // 5 requests per 15 minutes
	/** Moderate limit for API endpoints */
	api: { maxRequests: 100, windowMs: 15 * 60 * 1000 } as const, // 100 requests per 15 minutes
	/** Permissive limit for general pages */
	general: { maxRequests: 1000, windowMs: 15 * 60 * 1000 } as const // 1000 requests per 15 minutes
};

/**
 * In-memory store for rate limiting
 * In production with multiple server instances, use Redis or a similar distributed store
 */
const rateLimitStore = new Map<string, RateLimitStore>();

/**
 * Clean up expired entries from the rate limit store
 * Should be called periodically to prevent memory leaks
 */
function cleanupExpiredEntries(): void {
	const now = Date.now();
	for (const [key, value] of rateLimitStore.entries()) {
		if (value.resetTime < now) {
			rateLimitStore.delete(key);
		}
	}
}

// Clean up expired entries every 5 minutes
if (typeof setInterval !== 'undefined') {
	setInterval(cleanupExpiredEntries, 5 * 60 * 1000);
}

/**
 * Extract a unique identifier from the request for rate limiting
 * Uses IP address (from CF-Connecting-IP, X-Forwarded-For, or fallback to event.getClientAddress)
 */
function getClientIdentifier(event: RequestEvent): string {
	// Check for Cloudflare's connecting IP header
	const cfIp = event.request.headers.get('CF-Connecting-IP');
	if (cfIp) return cfIp;

	// Check for X-Forwarded-For header
	const xff = event.request.headers.get('X-Forwarded-For');
	if (xff) {
		// Take the first IP (original client) if there are multiple
		return xff.split(',')[0].trim();
	}

	// Fallback to SvelteKit's getClientAddress
	return event.getClientAddress();
}

/**
 * Check if a request should be rate limited
 * @param event - The SvelteKit request event
 * @param config - Rate limit configuration
 * @returns Object with rate limit info
 * @throws Error with status 429 if rate limit is exceeded
 */
export function checkRateLimit(
	event: RequestEvent,
	config: RateLimitConfig = DEFAULT_LIMITS.auth
): { limit: number; remaining: number; reset: Date } {
	const identifier = getClientIdentifier(event);
	const now = Date.now();
	const key = `${identifier}:${event.url.pathname}`;

	// Get or create rate limit entry
	let entry = rateLimitStore.get(key);

	if (!entry || entry.resetTime < now) {
		// Create new entry
		entry = {
			count: 0,
			resetTime: now + config.windowMs
		};
		rateLimitStore.set(key, entry);
	}

	// Check if limit is exceeded
	if (entry.count >= config.maxRequests) {
		throw error(
			429,
			`Too many requests. Please try again in ${Math.ceil((entry.resetTime - now) / 1000)} seconds.`
		);
	}

	// Increment counter
	entry.count++;

	// Calculate remaining requests
	const remaining = Math.max(0, config.maxRequests - entry.count);

	return {
		limit: config.maxRequests,
		remaining,
		reset: new Date(entry.resetTime)
	};
}

/**
 * Rate limiting middleware for SvelteKit hooks
 *
 * @example Usage in hooks.server.ts:
 * ```ts
 * import { rateLimitMiddleware } from '$lib/middleware/rate-limit';
 *
 * export const handle = async ({ event, resolve }) => {
 *   // Apply rate limiting to auth endpoints
 *   if (event.url.pathname.startsWith('/auth')) {
 *     rateLimitMiddleware(event, 'auth');
 *   }
 *
 *   return resolve(event);
 * };
 * ```
 */
export function rateLimitMiddleware(
	event: RequestEvent,
	preset: keyof typeof DEFAULT_LIMITS = 'auth'
): void {
	const config = DEFAULT_LIMITS[preset];
	const result = checkRateLimit(event, config);

	// Add rate limit headers to response
	// Note: These headers will be set on the response by the error handler
	// or by setting them in event.locals for later use
	event.locals.rateLimit = result;
}
