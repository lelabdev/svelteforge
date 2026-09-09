import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { env } from '$env/dynamic/private';
import { dbConfigFor, resolveDbRuntime, type DbRuntime } from './config';

export type { DbRuntime } from './config';

export interface CreateDbOptions {
	/** Connection string. Defaults to DATABASE_URL. */
	url?: string;
	/** Process lifecycle. Defaults to DATABASE_RUNTIME, else long-lived (#332). */
	runtime?: DbRuntime;
}

/**
 * Create the PostgreSQL client + Drizzle binding for THIS process (#332).
 *
 * The client is configured for the runtime lifecycle:
 *   - long-lived (default): classic pool, driver defaults;
 *   - serverless (DATABASE_RUNTIME=serverless): single recycled connection,
 *     prepared statements off (pooler-safe) — see `config.ts`.
 *
 * Nothing connects until the first query: importing this module is safe in
 * every context, including `vite build` postbuild analysis.
 */
export function createDb(options: CreateDbOptions = {}) {
	const url = options.url ?? env.DATABASE_URL;
	if (!url) throw new Error('DATABASE_URL is not set');
	const config = dbConfigFor(options.runtime ?? resolveDbRuntime(env.DATABASE_RUNTIME));
	const client = postgres(url, { ...config.clientOptions });
	return { db: drizzle(client, { schema }), client, runtime: config.runtime };
}

let cached: ReturnType<typeof createDb> | undefined;

/** Lazily-initialized shared instance — the pool opens on first USE, not at module load. */
function shared(): ReturnType<typeof createDb> {
	return (cached ??= createDb());
}

/** Explicit accessor for the shared Drizzle instance. */
export function getDb(): ReturnType<typeof createDb>['db'] {
	return shared().db;
}

type Db = ReturnType<typeof createDb>['db'];

/**
 * Shared Drizzle instance (`import { db } from '$lib/server/db'` — the
 * canonical pattern across SVForge modules). A lazy proxy so module
 * evaluation never opens a pool (#332); the first query initializes it.
 */
export const db: Db = new Proxy({} as Db, {
	get(_target, property, receiver) {
		return Reflect.get(shared().db as object, property, receiver);
	}
});
