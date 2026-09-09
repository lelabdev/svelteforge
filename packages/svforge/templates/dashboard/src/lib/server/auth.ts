import { betterAuth } from 'better-auth/minimal';
import { APIError } from 'better-auth/api';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { env } from '$env/dynamic/private';
import { getRequestEvent } from '$app/server';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { user, session, account, verification } from '$lib/server/db/schema';

export const auth = betterAuth({
	baseURL: env.ORIGIN,
	secret: env.BETTER_AUTH_SECRET,
	// Since better-auth 1.7 (#319) the drizzle adapter NO LONGER introspects
	// the drizzle instance — the model → table mapping must be passed
	// explicitly or every write fails with "Cannot convert undefined or null
	// to object". Kept in sync with src/lib/server/db/auth.schema.ts; the
	// scaffold gate diffs the CLI-generated schema against it.
	database: drizzleAdapter(db, {
		provider: 'pg',
		schema: { user, session, account, verification }
	}),
	emailAndPassword: { enabled: true },
	// This is deliberately enforced by Better Auth's session creation hook,
	// rather than only by the /login action. Every Better Auth flow that tries
	// to create a session (including POST /api/auth/sign-in/email) passes here.
	databaseHooks: {
		session: {
			create: {
				before: async (session) => {
					const [identity] = await db
						.select({ disabled: user.disabled })
						.from(user)
						.where(eq(user.id, session.userId))
						.limit(1);
					if (identity?.disabled) {
						throw new APIError('FORBIDDEN', {
							// Keep the lifecycle state private, as the login action does.
							message: 'Invalid credentials',
							code: 'USER_DISABLED'
						});
					}
				}
			}
		}
	},
	plugins: [
		sveltekitCookies(getRequestEvent) // make sure this is the last plugin in the array
	]
});
