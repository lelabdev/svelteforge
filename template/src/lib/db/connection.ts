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
	// IMPORTANT: First argument is the Database instance, second is options with schema
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
	try {
		dbSingleton = await initPromise;
	} catch (err) {
		// Reset so a subsequent call can retry
		initPromise = null;
		throw err;
	}
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
