/**
 * PostgreSQL client configuration per process lifecycle (#332).
 *
 * The runtime lifecycle decides how the client pools connections:
 *
 *   - `long-lived` (default) — an always-on Node process (adapter-node on a
 *     VPS/container). A real pool with warm connections is the right default;
 *     driver defaults apply.
 *   - `serverless` — request-scoped functions (Vercel/Lambda/Netlify). Every
 *     concurrent invocation would otherwise open its own pool and exhaust the
 *     provider's connection limit. One connection, aggressive recycling, and
 *     prepared statements OFF (transaction-mode poolers like PgBouncer,
 *     Supabase pooler or Neon reject them).
 *
 * Selected via `DATABASE_RUNTIME=serverless` (or explicitly through
 * `createDb({ runtime })`). Pure module on purpose: no framework imports, so
 * the policy is unit-testable.
 */

export type DbRuntime = 'long-lived' | 'serverless';

/** Options forwarded to postgres() — `undefined` means driver default. */
export interface PostgresClientOptions {
	max?: number;
	idle_timeout?: number;
	connect_timeout?: number;
	lifetime?: number;
	prepare?: boolean;
}

/**
 * Serverless-safe client options (#332): a single connection per invocation,
 * recycled between requests, compatible with transaction-mode poolers.
 */
export const SERVERLESS_CLIENT_OPTIONS: Required<PostgresClientOptions> = {
	max: 1,
	idle_timeout: 20,
	connect_timeout: 10,
	lifetime: 60,
	prepare: false
};

/** Resolve DATABASE_RUNTIME. Only the exact value (case-insensitive) selects serverless. */
export function resolveDbRuntime(value: string | undefined): DbRuntime {
	return typeof value === 'string' && value.trim().toLowerCase() === 'serverless' ? 'serverless' : 'long-lived';
}

/** The client configuration for one runtime lifecycle. */
export function dbConfigFor(runtime: DbRuntime): { runtime: DbRuntime; clientOptions: PostgresClientOptions } {
	if (runtime === 'serverless') {
		return { runtime, clientOptions: { ...SERVERLESS_CLIENT_OPTIONS } };
	}
	return { runtime, clientOptions: {} };
}
