import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { checkHealth } from '$lib/services';

export const GET: RequestHandler = async () => {
	try {
		const result = await checkHealth();
		return json(result);
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
