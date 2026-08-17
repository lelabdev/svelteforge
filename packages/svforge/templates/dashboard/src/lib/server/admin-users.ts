import { db } from '$lib/server/db';
import { user, account } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { hashPassword } from 'better-auth/crypto';

/**
 * Admin user creation — the ONLY supported way to create a credential user
 * from the dashboard (#292).
 *
 * WHY NOT `auth.api.signUpEmail`?
 * -------------------------------
 * `signUpEmail` sets a session cookie for the newly created user, which would
 * silently replace the current admin's session. Admin-created users must not
 * hijack the admin's browser session.
 *
 * Instead we reproduce the exact credential contract of Better Auth 1.4.x,
 * verified against the package sources (`api/routes/sign-up.mjs`,
 * `db/internal-adapter.mjs`):
 *
 *   - `email` is stored LOWERCASED — `findUserByEmail` (used by sign-in)
 *     always looks up `email.toLowerCase()`, so a mixed-case stored email can
 *     never be logged into.
 *   - `providerId` is `'credential'` and `accountId` is the USER id (NOT the
 *     email) — that is what `linkAccount` does in the real sign-up flow.
 *   - the password is hashed with the same scrypt `hashPassword` that
 *     Better Auth's default `password.hash` uses (`better-auth/crypto`),
 *     so `signInEmail` can verify it.
 *   - `emailVerified` defaults to `false`, exactly like sign-up.
 *
 * The user row and the credential account row are created in ONE transaction:
 * a user without its credential account could never sign in (orphan row), so
 * the two inserts must be atomic.
 *
 * This helper NEVER creates a session — the admin's own session is untouched.
 */

export class DuplicateEmailError extends Error {
	constructor() {
		super('email already exists');
		this.name = 'DuplicateEmailError';
	}
}

export interface CreateCredentialUserInput {
	name: string;
	email: string;
	password: string;
}

export async function createCredentialUser({
	name,
	email,
	password
}: CreateCredentialUserInput): Promise<{ id: string; email: string }> {
	const normalizedEmail = email.toLowerCase();

	// Duplicate check — case-insensitive, matching Better Auth's lookup.
	const [existing] = await db
		.select({ id: user.id })
		.from(user)
		.where(eq(user.email, normalizedEmail))
		.limit(1);
	if (existing) {
		throw new DuplicateEmailError();
	}

	const hashedPassword = await hashPassword(password);
	const userId = crypto.randomUUID();

	try {
		await db.transaction(async (tx) => {
			await tx.insert(user).values({
				id: userId,
				name,
				email: normalizedEmail,
				emailVerified: false,
				createdAt: new Date(),
				updatedAt: new Date()
			});

			await tx.insert(account).values({
				id: crypto.randomUUID(),
				userId,
				// Contract: accountId === userId for credential accounts (#292).
				accountId: userId,
				providerId: 'credential',
				password: hashedPassword,
				createdAt: new Date(),
				updatedAt: new Date()
			});
		});
	} catch (error) {
		if (error instanceof DuplicateEmailError) throw error;
		// A race on the unique email index or any other DB failure must roll
		// back BOTH rows — the transaction guarantees the user is not orphaned.
		throw new Error('failed to create user');
	}

	return { id: userId, email: normalizedEmail };
}
