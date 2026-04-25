/**
 * Database connection module
 * Handles the creation and management of database connections using Bun SQLite
 */

// Handle optional SvelteKit environment
let building = false;
try {
	const env = await import('$app/environment');
	building = env.building;
} catch (e) {
	// Not in SvelteKit context
}

import * as schema from './schemas';
import type { DatabaseConfig } from './config';
import { validateDatabaseUrl, getDatabaseConfig } from './config';

let dbSingleton: any = null;
let initPromise: Promise<any> | null = null;

/**
 * Lazy-load drizzle and bun:sqlite only at runtime (not during build)
 * This is necessary because bun:sqlite is not available during Vite's build process
 * or during svelte-check (which runs in Node, not Bun)
 */
async function initializeDb(config: DatabaseConfig) {
	validateDatabaseUrl(config.databaseUrl);
	const { drizzle } = await import('drizzle-orm/bun-sqlite');
	// @ts-expect-error - bun:sqlite is only available at runtime in Bun
	const { Database } = await import('bun:sqlite');

	const sqlite = new Database(config.databaseUrl);

	// Enable WAL mode for concurrent read/write access (readers don't block writers)
	// Without WAL, SQLite uses journal mode which locks the DB during writes
	sqlite.exec('PRAGMA journal_mode=WAL');
	// Set busy timeout (ms) — how long to wait if DB is locked before throwing SQLITE_BUSY
	sqlite.exec('PRAGMA busy_timeout=5000');
	// Enable foreign keys (off by default in SQLite)
	sqlite.exec('PRAGMA foreign_keys=ON');
	// Normal sync mode — safe enough for WAL, faster than FULL
	sqlite.exec('PRAGMA synchronous=NORMAL');

	return drizzle(sqlite, { schema });
}

/**
 * Initialize the database connection asynchronously
 * Should be called once at server startup
 */
export async function initDb(config?: DatabaseConfig): Promise<any> {
	if (dbSingleton) return dbSingleton;
	if (initPromise) return initPromise;

	const finalConfig = config || getDatabaseConfig();
	initPromise = initializeDb(finalConfig);
	dbSingleton = await initPromise;
	return dbSingleton;
}

/**
 * Create a new Drizzle database instance with Bun SQLite
 * This function is exported to allow creating multiple DB instances if needed
 */
export async function createDb(config: DatabaseConfig) {
	return initializeDb(config);
}

/**
 * Get the singleton database instance
 * Initializes synchronously if already initialized, throws otherwise
 * Use initDb() first to ensure the database is ready
 *
 * @param config - Optional config to use instead of the default
 */
export function getDb(config?: DatabaseConfig) {
	// Standalone scripts won't have the building flag
	if (typeof building !== 'undefined' && building) {
		throw new Error('Database cannot be accessed during build');
	}
	if (!dbSingleton) {
		throw new Error('Database not initialized. Call initDb() first at server startup.');
	}
	return dbSingleton;
}

/**
 * Reset the singleton database instance
 * This is primarily used for testing
 */
export function resetDb(): void {
	dbSingleton = null;
	initPromise = null;
}

/**
 * Legacy alias for getDb for backward compatibility
 */
export function getDbInstance(config?: DatabaseConfig) {
	return getDb(config);
}
