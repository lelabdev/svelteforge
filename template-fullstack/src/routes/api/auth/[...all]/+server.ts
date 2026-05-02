import { auth } from '$lib/auth';
import type { RequestHandler } from './$types';

/**
 * BetterAuth handler for email verification and OAuth callbacks.
 * This route is only needed for handling email verification links and OAuth callbacks.
 * All form submissions (login, signup, logout, password reset) now use SvelteKit Actions.
 */
export const GET: RequestHandler = async ({ request }) => {
	return auth.handler(request);
};

export const POST: RequestHandler = async ({ request }) => {
	return auth.handler(request);
};
