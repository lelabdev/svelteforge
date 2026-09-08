import { beforeEach, describe, expect, it, vi } from 'vitest';

// The dashboard's DB tests run in the scaffold CI after drizzle-kit push. Read
// its generated .env because $env/dynamic/private is a SvelteKit virtual module.
vi.mock('$app/server', () => ({ getRequestEvent: () => undefined }));

vi.mock('$env/dynamic/private', async () => {
	const { readFileSync } = await import('node:fs');
	const dotenv = readFileSync('.env', 'utf8');
	const value = (key: string) => dotenv.match(new RegExp(`^${key}="?([^"\\n]+)"?$`, 'm'))?.[1].trim();
	return { env: { DATABASE_URL: value('DATABASE_URL'), ORIGIN: value('ORIGIN'), BETTER_AUTH_SECRET: value('BETTER_AUTH_SECRET') } };
});

import { auth } from './auth';
import { createCredentialUser } from './admin-users';
import { db } from '$lib/server/db';
import { session, user } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

const PASSWORD = 'password123';
let userId: string;
let email: string;

describe('disabled Better Auth identities (#337)', () => {
	beforeEach(async () => {
		// Do not clear the shared scaffold database: Vitest runs this alongside
		// the credential lifecycle suite, so each test owns a unique identity.
		email = `disabled-${crypto.randomUUID()}@example.com`;
		const identity = await createCredentialUser({ name: 'Disabled', email, password: PASSWORD });
		userId = identity.id;
		await db.update(user).set({ disabled: true }).where(eq(user.id, userId));
	});

	it('rejects the real email sign-in endpoint before it creates a session', async () => {
		const response = await auth.handler(
			new Request('http://localhost:5173/api/auth/sign-in/email', {
				method: 'POST',
				headers: { 'content-type': 'application/json', origin: 'http://localhost:5173' },
				body: JSON.stringify({ email, password: PASSWORD })
			})
		);

		expect(response.status).toBe(403);
		expect(response.headers.get('set-cookie')).toBeNull();
		expect(await db.select({ id: session.id }).from(session).where(eq(session.userId, userId))).toHaveLength(0);
	});
});
