/**
 * Authentication context for BetterAuth
 *
 * Provides access to the current SvelteKit RequestEvent for BetterAuth plugins
 * This is needed for the sveltekitCookies plugin to work properly
 *
 * Uses AsyncLocalStorage to ensure each request has its own isolated context,
 * preventing race conditions when multiple concurrent requests are processed.
 */

import { AsyncLocalStorage } from 'node:async_hooks';
import type { RequestEvent } from '@sveltejs/kit';

/**
 * AsyncLocalStorage ensures each concurrent request gets its own RequestEvent.
 * This prevents race conditions where request B could overwrite request A's event.
 */
const eventStorage = new AsyncLocalStorage<RequestEvent>();

/**
 * Run a callback with the RequestEvent available in the async context.
 * All calls to getCurrentRequestEvent() within the callback will return this event.
 *
 * @param event - The current SvelteKit RequestEvent
 * @param callback - The async function to run with the event context
 */
export function runInEventContext<R>(event: RequestEvent, callback: () => Promise<R>): Promise<R> {
	return eventStorage.run(event, callback);
}

/**
 * Get the current RequestEvent from the async context (for BetterAuth plugins).
 * Returns null if called outside of a request context.
 */
export function getCurrentRequestEvent(): RequestEvent | null {
	return eventStorage.getStore() ?? null;
}

/**
 * Debug helper to log current cookies (dev only)
 */
export function debugCookies(event: RequestEvent) {
	const allCookies = event.cookies.getAll();
	console.log(
		'[auth-context] Cookies from event.cookies.getAll():',
		allCookies.map((c) => ({ name: c.name, value: c.value?.substring(0, 20) }))
	);
	console.log('[auth-context] Cookie header:', event.request.headers.get('cookie'));
}
