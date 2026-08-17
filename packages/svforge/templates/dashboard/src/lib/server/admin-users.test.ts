import { describe, it, expect, beforeAll, vi } from 'vitest';

// $env/dynamic/private is a SvelteKit virtual module — not resolvable by the
// bare vitest environment. Read DATABASE_URL from the project .env (created
// by scripts/setup.sh before the CI runs `bun run test`).
vi.mock('$env/dynamic/private', async () => {
	const { readFileSync } = await import('node:fs');
	const dotenv = readFileSync('.env', 'utf8');
	const m = dotenv.match(/^DATABASE_URL="?([^"\n]+)"?$/m);
	return { env: { DATABASE_URL: m ? m[1].trim() : undefined } };
});

import { createCredentialUser, DuplicateEmailError } from './admin-users';
import { verifyPassword } from 'better-auth/crypto';
import { db } from '$lib/server/db';
import { user, account, session } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Better Auth credential lifecycle (#292) — runs inside the dashboard
 * scaffold against the REAL PostgreSQL database (the CI profile performs a
 * drizzle push before `bun run test`).
 *
 * Proves the admin-created user matches the exact credential contract that
 * `signInEmail` expects: lowercase email lookup, `providerId: 'credential'`,
 * `accountId === userId`, scrypt hash verifiable by Better Auth, atomic
 * user+account creation, and NO session side-effect (the admin's own session
 * must survive the creation).
 */
const ADMIN = crypto.randomUUID();
const PASSWORD = 'password123';

async function cleanupUsers() {
	// FK cascades wipe account + session rows of every user.
	await db.delete(user);
}

describe('admin-created credential users (#292)', () => {
	beforeAll(async () => {
		await cleanupUsers();
		// Seed the admin (first user = admin under the first-user-is-admin
		// pattern used by the dashboard).
		await createCredentialUser({ name: 'Admin', email: 'admin@example.com', password: PASSWORD });
	});

	it('stores the email lowercased exactly like Better Auth sign-up (#292)', async () => {
		await createCredentialUser({ name: 'Bob', email: 'Bob@Example.COM', password: PASSWORD });

		const [byLowerCase] = await db.select({ id: user.id }).from(user).where(eq(user.email, 'bob@example.com')).limit(1);
		expect(byLowerCase).toBeDefined();

		// Mixed case never matches: signInEmail looks up email.toLowerCase(),
		// so a stored mixed-case email could never be logged into.
		const [byMixedCase] = await db.select({ id: user.id }).from(user).where(eq(user.email, 'Bob@Example.COM')).limit(1);
		expect(byMixedCase).toBeUndefined();
	});

	it('creates the credential account per the BA contract: providerId credential, accountId = userId (#292)', async () => {
		const created = await createCredentialUser({ name: 'Carol', email: 'carol@example.com', password: PASSWORD });

		const [acc] = await db.select().from(account).where(eq(account.userId, created.id)).limit(1);
		expect(acc).toBeDefined();
		expect(acc.providerId).toBe('credential');
		expect(acc.accountId).toBe(created.id); // NOT the email — sign-up contract
	});

	it('hashes the password so Better Auth verifyPassword accepts it (#292)', async () => {
		const created = await createCredentialUser({ name: 'Dan', email: 'dan@example.com', password: PASSWORD });

		const [acc] = await db.select().from(account).where(eq(account.userId, created.id)).limit(1);
		expect(acc).toBeDefined();
		// password is nullable in the schema — the credential contract guarantees
		// it is set for credential accounts.
		const hash = acc!.password!;
		const ok = await verifyPassword({ hash, password: PASSWORD });
		expect(ok).toBe(true);
		const ko = await verifyPassword({ hash: acc!.password!, password: 'wrong-password' });
		expect(ko).toBe(false);
	});

	it('duplicate email in ANY case is rejected and creates no second user (#292)', async () => {
		await expect(
			createCredentialUser({ name: 'Bob Clone', email: 'BOB@example.com', password: PASSWORD })
		).rejects.toBeInstanceOf(DuplicateEmailError);

		const count = await db.select({ id: user.id }).from(user).where(eq(user.email, 'bob@example.com'));
		expect(count).toHaveLength(1);
	});

	it('creates the user and account atomically — a failed insert leaves NO orphan user (#292)', async () => {
		// Race two identical creates: the pre-check may pass for both, so the
		// second insert hits the unique email index inside the transaction and
		// must roll back BOTH rows — never a user without its account.
		const results = await Promise.allSettled([
			createCredentialUser({ name: 'Eve', email: 'eve@example.com', password: PASSWORD }),
			createCredentialUser({ name: 'Eve Clone', email: 'eve@example.com', password: PASSWORD })
		]);
		expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
		expect(results.filter((r) => r.status === 'rejected')).toHaveLength(1);

		const eves = await db.select({ id: user.id }).from(user).where(eq(user.email, 'eve@example.com'));
		expect(eves).toHaveLength(1);
		const evesAccounts = await db.select().from(account).where(eq(account.userId, eves[0].id));
		expect(evesAccounts).toHaveLength(1);
	});

	it('never creates a session — the admin session is untouched (#292)', async () => {
		const sessionsBefore = await db.select({ id: session.id }).from(session);

		await createCredentialUser({ name: 'Frank', email: 'frank@example.com', password: PASSWORD });

		const sessionsAfter = await db.select({ id: session.id }).from(session);
		expect(sessionsAfter).toHaveLength(sessionsBefore.length);
	});

	it('the creation helper uses a DB transaction (structural atomicity guard) (#292)', async () => {
		const txSpy = vi.spyOn(db, 'transaction');
		await createCredentialUser({ name: 'Grace', email: 'grace@example.com', password: PASSWORD });
		expect(txSpy).toHaveBeenCalled();
		txSpy.mockRestore();
	});
});
