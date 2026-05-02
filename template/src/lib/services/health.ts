import { getDb } from '$lib/db/connection';
import { sql } from 'drizzle-orm';

/**
 * Health check service — wraps DB access behind the service layer.
 * Routes should call this instead of importing db directly.
 */
export async function checkHealth(): Promise<{ status: string; timestamp: string }> {
	const db = getDb();
	await db.execute(sql`SELECT 1`);
	return {
		status: 'ok',
		timestamp: new Date().toISOString()
	};
}
