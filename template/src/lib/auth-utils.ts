/**
 * Authentication utilities for server-side code
 * Reduces duplicated admin check logic across API routes
 */

import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';

export interface AuthSession {
	user: {
		id: string;
		email: string;
		name: string;
		role?: string;
	};
	session: {
		id: string;
	};
}

export interface AuthResult {
	success: true;
	session: AuthSession;
}

export interface AuthError {
	success: false;
	response: Response;
}

/**
 * Get the current session from the request
 * Returns null if not authenticated
 *
 * Note: Session is populated in hooks.server.ts via auth.api.getSession()
 * and stored in event.locals.session/user for efficient access
 */
export async function getSession(event: RequestEvent): Promise<AuthSession | null> {
	try {
		// Use pre-populated session from hooks.server.ts
		const session = event.locals.session;
		const user = event.locals.user;

		if (!session || !user) {
			return null;
		}

		return {
			user: {
				id: user.id,
				email: user.email,
				name: user.name,
				role: user.role ?? undefined
			},
			session: {
				id: session.id
			}
		};
	} catch {
		return null;
	}
}

/**
 * Require authentication for a route
 * Returns the session if authenticated, or a 401 response
 */
export async function requireAuth(event: RequestEvent): Promise<AuthSession | Response> {
	const session = await getSession(event);

	if (!session) {
		return json({ error: 'Not authenticated' }, { status: 401 });
	}

	return session;
}

/**
 * Require the user to be an admin
 * Returns 403 if not admin, redirect to login if not authenticated
 */
export async function requireAdmin(event: RequestEvent): Promise<AuthSession | Response> {
	const session = await getSession(event);

	if (!session) {
		return json({ error: 'Not authenticated' }, { status: 401 });
	}

	if (session.user?.role !== 'admin') {
		return json({ error: 'Forbidden' }, { status: 403 });
	}

	return session;
}

/**
 * Type guard to check if the result is a Response (error)
 */
export function isAuthError(result: AuthSession | Response): result is Response {
	return result instanceof Response;
}
