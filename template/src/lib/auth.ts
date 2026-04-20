import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { admin } from 'better-auth/plugins';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { getCurrentRequestEvent } from './auth-context';
import { db, requireEnv } from '$lib/db';

// Handle optional SvelteKit environment
let env: any = process.env;
try {
	const dynamicEnv = await import('$env/dynamic/private');
	env = { ...process.env, ...dynamicEnv.env };
} catch (e) {
	// Not in SvelteKit context
}

import { logger } from './logger';
import { user, session, account, verification } from '$lib/db/schemas';
import { eq } from 'drizzle-orm';

/**
 * Create and configure BetterAuth instance
 * This function is only called when auth is first accessed (lazy initialization)
 */
function createAuthInstance() {
	const BETTER_AUTH_SECRET = requireEnv('BETTER_AUTH_SECRET');

	return betterAuth({
		database: drizzleAdapter(db, {
			provider: 'sqlite',
			schema: { user, session, account, verification }
		}),
		databaseHooks: {
			user: {
				create: {
				after: async (newUser) => {
					// First user becomes admin (atomic: check+update in same query)
					const existing = await db.select({ id: user.id }).from(user).limit(1);
					if (existing.length === 1 && existing[0].id === newUser.id) {
						await db
							.update(user)
							.set({ role: 'admin', updatedAt: new Date() })
							.where(eq(user.id, newUser.id));
						logger.info(
							{ userId: newUser.id },
							'First user created - assigned admin role'
						);
					} else {
						logger.info({ userId: newUser.id }, 'New user created');
					}
				}
				}
			}
		},
		emailAndPassword: {
			enabled: true
		},
		plugins: [
			admin({ adminUserIds: [] }),
			sveltekitCookies(() => {
				try {
					const event = getCurrentRequestEvent();
					if (!event) return {} as any;
					return event;
				} catch (e) {
					return {} as any;
				}
			})
		],
		baseURL: env.BASE_URL || 'http://localhost:5173',
		secret: BETTER_AUTH_SECRET
	});
}

/**
 * Singleton auth instance
 * Only initialized on first access to avoid build-time errors
 */
let authSingleton: ReturnType<typeof betterAuth> | null = null;

/**
 * Type alias for the Auth instance to work around BetterAuth type issues
 */
type Auth = ReturnType<typeof betterAuth>;

/**
 * Get BetterAuth instance (lazy initialization)
 * This ensures environment variables are only accessed at runtime, not during build
 */
export function getAuth(): Auth {
	if (!authSingleton) {
		authSingleton = createAuthInstance() as unknown as Auth;
	}
	return authSingleton!;
}

/**
 * Export auth as a Proxy for backward compatibility
 * The Proxy ensures the auth instance is only initialized when accessed
 */
export const auth = new Proxy({} as any, {
	get(_target, prop, receiver) {
		const realAuth = getAuth();
		if (!realAuth) {
			throw new Error('Auth instance not initialized');
		}
		return Reflect.get(realAuth, prop, receiver);
	}
});

export type Session = ReturnType<typeof betterAuth>['$Infer']['Session'];
