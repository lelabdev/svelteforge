import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDb } from '$lib/db/connection';
import { sql } from 'drizzle-orm';

export const GET: RequestHandler = async () => {
	try {
		const db = getDb();

		// Simple query to confirm DB is responsive
		await db.execute(sql`SELECT 1`);

		return json({
			status: 'ok',
			timestamp: new Date().toISOString()
		});
	} catch (error) {
		return json(
			{
				status: 'error',
				message: error instanceof Error ? error.message : 'Health check failed'
			},
			{ status: 503 }
		);
	}
};
