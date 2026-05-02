import { svelteKitHandler } from 'better-auth/svelte-kit';
import { auth } from '$lib/auth';
import { runInEventContext } from '$lib/auth-context';
import { createChildLogger } from '$lib/logger';
import { rateLimitMiddleware } from '$lib/middleware/rate-limit';
import type { Handle } from '@sveltejs/kit';
import { building } from '$app/environment';
import { initDb } from '$lib/db/connection';

// Initialize database connection on server startup (not during build)
if (!building) {
	initDb().catch((error) => {
		console.error('Failed to initialize database:', error);
	});
}

// Content Security Policy configuration
// NOTE: unsafe-eval is only included in development for HMR
const isDev = import.meta.env.DEV;
const CSP_HEADER = [
	"default-src 'self'",
	`script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
	"worker-src 'self' blob:",
	"style-src 'self' 'unsafe-inline'",
	"img-src 'self' data: https:",
	"font-src 'self'",
	"connect-src 'self'",
	"frame-ancestors 'none'",
	"frame-src 'self'",
	"base-uri 'self'",
	"form-action 'self'",
	'block-all-mixed-content',
	'upgrade-insecure-requests'
].join('; ');

export const handle: Handle = async ({ event, resolve }) => {
	return runInEventContext(event, async () => {
		const logger = createChildLogger({
			requestId: crypto.randomUUID(),
			path: event.url.pathname,
			method: event.request.method
		});

		const start = Date.now();

		try {
			// Apply rate limiting to sensitive endpoints
			const pathname = event.url.pathname;
			if (
				pathname.startsWith('/login') ||
				pathname.startsWith('/signup') ||
				pathname.startsWith('/forgot-password') ||
				pathname.startsWith('/reset-password')
			) {
				rateLimitMiddleware(event, 'auth');
			} else if (pathname.startsWith('/api/') && !pathname.startsWith('/api/health')) {
				rateLimitMiddleware(event, 'api');
			}

			// Fetch session and populate event.locals BEFORE svelteKitHandler
			const session = await auth.api.getSession({
				headers: event.request.headers
			});

			event.locals.auth = auth;

			if (session) {
				event.locals.session = session.session;
				event.locals.user = session.user;
			} else {
				event.locals.session = null;
				event.locals.user = null;
			}

			const response = await svelteKitHandler({ auth, event, resolve, building });

			logger.info({
				method: event.request.method,
				url: event.url.pathname,
				status: response.status,
				duration: Date.now() - start
			});

			// Apply security headers to all responses
			const headers = new Headers(response.headers);
			headers.set('Content-Security-Policy', CSP_HEADER);
			headers.set('X-Content-Type-Options', 'nosniff');
			headers.set('X-Frame-Options', 'DENY');
			headers.set('X-XSS-Protection', '1; mode=block');
			headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
			headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=(), payment=()');

			if (event.locals.rateLimit) {
				const { limit, remaining, reset } = event.locals.rateLimit;
				headers.set('RateLimit-Limit', limit.toString());
				headers.set('RateLimit-Remaining', remaining.toString());
				headers.set('RateLimit-Reset', Math.ceil(reset.getTime() / 1000).toString());
			}

			if (event.url.protocol === 'https:') {
				headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
			}
			headers.delete('x-sveltekit-page');

			return new Response(response.body, {
				status: response.status,
				statusText: response.statusText,
				headers
			});
		} catch (error) {
			logger.error({ error: (error as Error).message });
			return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
				status: 500,
				headers: { 'Content-Type': 'application/json' }
			});
		}
	});
};
