import { describe, it, expect, beforeAll, vi } from 'vitest';

// $env/dynamic/private is a SvelteKit virtual module — not resolvable by the
// bare vitest environment. Read DATABASE_URL from the project .env (created
// by scripts/setup.sh before the CI runs `bun run test`).
vi.mock('$env/dynamic/private', async () => {
	const { readFileSync } = await import('node:fs');
	const dotenv = readFileSync('.env', 'utf8');
	const value = (key: string) => dotenv.match(new RegExp(`^${key}="?([^"\\n]+)"?$`, 'm'))?.[1].trim();
	return { env: { DATABASE_URL: value('DATABASE_URL'), ORIGIN: value('ORIGIN'), BETTER_AUTH_SECRET: value('BETTER_AUTH_SECRET') } };
});

// The real auth instance wires sveltekitCookies(getRequestEvent); outside a
// request the event is simply absent, exactly like auth.test.ts (#337).
vi.mock('$app/server', () => ({ getRequestEvent: () => undefined }));

import { createCredentialUser, DuplicateEmailError } from './admin-users';
import { verifyPassword } from 'better-auth/crypto';
import { auth } from './auth';
import { env } from '$env/dynamic/private';
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
		// Seed a regular user (admin-created users are ALWAYS role 'user' —
		// the admin role is granted only by bootstrapFirstAdmin, #318).
		await createCredentialUser({ name: 'Admin', email: 'admin@example.com', password: PASSWORD });
	});

	/** Signs in through the REAL Better Auth endpoint (same pattern as auth.test.ts #337). */
	function signInAs(email: string, password: string): Promise<Response> {
		const origin = env.ORIGIN ?? 'http://localhost:5173';
		return auth.handler(
			new Request(`${origin}/api/auth/sign-in/email`, {
				method: 'POST',
				headers: { 'content-type': 'application/json', origin },
				body: JSON.stringify({ email, password })
			})
		);
	}

	it('admin A creates B without losing their own session; B can sign in (#319)', async () => {
		// A (admin) signs in and owns a live session.
		const adminResponse = await signInAs('admin@example.com', PASSWORD);
		expect(adminResponse.status).toBe(200);
		const adminSessionCookie = adminResponse.headers.get('set-cookie');
		expect(adminSessionCookie).toContain('better-auth.session_token');

		const sessionsWhenAdminActive = await db.select({ id: session.id }).from(session);

		// A creates B — the creation must not create, drop, or replace any session.
		const created = await createCredentialUser({ name: 'Ivy', email: 'ivy@example.com', password: PASSWORD });
		const sessionsAfterCreate = await db.select({ id: session.id }).from(session);
		expect(sessionsAfterCreate).toHaveLength(sessionsWhenAdminActive.length);

		// B signs in with the real Better Auth credential flow (hash verified
		// by signInEmail against the account row the helper created).
		const ivyResponse = await signInAs('ivy@example.com', PASSWORD);
		expect(ivyResponse.status).toBe(200);
		expect(ivyResponse.headers.get('set-cookie')).toContain('better-auth.session_token');
		const body = (await ivyResponse.json()) as { user?: { id?: string; email?: string } };
		expect(body.user?.id).toBe(created.id);
		expect(body.user?.email).toBe('ivy@example.com');

		// B's session exists in the DB and belongs to the created user id.
		const graceSessions = await db.select({ id: session.id, userId: session.userId }).from(session).where(eq(session.userId, created.id));
		expect(graceSessions).toHaveLength(1);
	});

	it('rejects a wrong password through the real sign-in endpoint (#319)', async () => {
		await createCredentialUser({ name: 'Heidi', email: 'heidi@example.com', password: PASSWORD });
		const response = await signInAs('heidi@example.com', 'wrong-password-123');
		expect(response.status).toBe(401);
		expect(response.headers.get('set-cookie')).toBeNull();
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

	it('admin-created users NEVER hold the admin role (#318)', async () => {
		await createCredentialUser({ name: 'Plain', email: 'plain@example.com', password: PASSWORD });
		const [identity] = await db.select({ role: user.role }).from(user).where(eq(user.email, 'plain@example.com')).limit(1);
		expect(identity.role).toBe('user');
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
