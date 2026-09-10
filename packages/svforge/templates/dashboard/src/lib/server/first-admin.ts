import { eq, sql } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { hashPassword } from 'better-auth/crypto';
import { account, user } from './db/schema';
import type * as schema from './db/schema';

/**
 * First-admin bootstrap (#318) — the ONLY path that grants the `admin` role.
 *
 * SECURITY MODEL
 * --------------
 * The dashboard has NO public takeover window: sign-up is closed by default
 * (`SIGNUP_MODE`, see signup-mode.ts) and the `admin` role is an explicit
 * persisted column that NO sign-up flow can set. The initial administrator
 * is created exclusively here — by the operator command
 * (`bun run admin:create`) or the dev-only `/setup` route — under an
 * ATOMIC invariant:
 *
 *   1. a transaction-scoped PostgreSQL advisory lock serializes concurrent
 *      bootstraps (`pg_advisory_xact_lock` — released at commit/rollback);
 *   2. INSIDE the lock, the absence of any existing administrator is
 *      verified — a stale `createdAt` order can never decide authorization;
 *   3. only then is the admin inserted, with its credential account, in the
 *      same transaction.
 *
 * Two concurrent bootstraps therefore serialize: the second one sees the
 * first one's committed-or-in-flight admin row and aborts — exactly one
 * administrator can ever result (proven by first-admin.test.ts).
 *
 * This module is intentionally importable OUTSIDE SvelteKit (relative
 * imports only, the db instance is a parameter): scripts/create-admin.ts
 * shares the exact same code path as the app.
 */

/** Fixed (int, int) advisory-lock key identifying "dashboard first-admin". */
const BOOTSTRAP_LOCK = sql`SELECT pg_advisory_xact_lock(86037, 15089)`;

export class AdminExistsError extends Error {
	constructor() {
		super('an administrator already exists');
		this.name = 'AdminExistsError';
	}
}

export interface BootstrapAdminInput {
	name: string;
	email: string;
	password: string;
}

export type DashboardDb = PostgresJsDatabase<typeof schema>;

/** The transaction handle handed to the bootstrap callback. */
export type DashboardTx = Parameters<Parameters<DashboardDb['transaction']>[0]>[0];

type DbOrTx = DashboardDb | DashboardTx;

/** True when at least one administrator exists — regardless of `disabled`. */
export async function adminExists(db: DbOrTx): Promise<boolean> {
	const [row] = await db.select({ id: user.id }).from(user).where(eq(user.role, 'admin')).limit(1);
	return row !== undefined;
}

/**
 * Creates the FIRST administrator. Rejects with `AdminExistsError` when any
 * administrator already exists. The password is hashed BEFORE the lock is
 * taken so the critical section stays short.
 */
export async function bootstrapFirstAdmin(
	db: DashboardDb,
	{ name, email, password }: BootstrapAdminInput
): Promise<{ id: string; email: string }> {
	const normalizedEmail = email.toLowerCase();
	const hashedPassword = await hashPassword(password);
	const userId = crypto.randomUUID();

	try {
		await db.transaction(async (tx) => {
			// 1. Serialize concurrent bootstraps — the lock lives until commit.
			await tx.execute(BOOTSTRAP_LOCK);
			// 2. Verify NO administrator exists — atomically, under the lock.
			if (await adminExists(tx)) {
				throw new AdminExistsError();
			}
			// 3. Same credential contract as admin-users.ts (#292): lowercased
			//    email, providerId 'credential', accountId = userId — so the
			//    admin can sign in through the real Better Auth flow.
			await tx.insert(user).values({
				id: userId,
				name,
				email: normalizedEmail,
				emailVerified: false,
				role: 'admin',
				createdAt: new Date(),
				updatedAt: new Date()
			});
			await tx.insert(account).values({
				id: crypto.randomUUID(),
				userId,
				accountId: userId,
				providerId: 'credential',
				password: hashedPassword,
				createdAt: new Date(),
				updatedAt: new Date()
			});
		});
	} catch (error) {
		if (error instanceof AdminExistsError) throw error;
		// Unique-email race or any other DB failure must surface as a generic
		// failure — never leak internals to the UI (#188). The cause stays
		// server-side for diagnostics.
		throw new Error('failed to create the first administrator', { cause: error });
	}

	return { id: userId, email: normalizedEmail };
}
