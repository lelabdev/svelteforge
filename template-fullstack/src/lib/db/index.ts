/**
 * Database module entry point
 * Exports a singleton database instance and related utilities
 */

import { getDb as getDbInstance, resetDb, initDb } from './connection';
export * from './schemas';
export * from './config';
export * from './types';
export { createDb, resetDb, initDb } from './connection';
export { requireEnv } from './config';

/**
 * Singleton database instance
 * Uses a Proxy to lazy-initialize on first access
 *
 * Usage:
 *   import { db } from '$lib/db';
 *   await db.select().from(users);
 *
 * For testing, you can use:
 *   import { setTestConfig, resetDb } from '$lib/db';
 *   setTestConfig({ databaseUrl: 'test-url' });
 *   // ... run tests ...
 *   resetDb();
 */
export const db = new Proxy({} as ReturnType<typeof getDbInstance>, {
	get(_target, prop, receiver) {
		const realDb = getDbInstance() as any;
		return Reflect.get(realDb, prop, receiver);
	}
});
