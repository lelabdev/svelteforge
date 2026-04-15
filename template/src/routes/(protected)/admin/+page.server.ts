import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { requireAdmin } from '$lib/auth-utils';

export const load: PageServerLoad = async (event) => {
	const result = await requireAdmin(event);

	if (result instanceof Response) {
		if (result.status === 401) {
			redirect(302, '/login');
		}
		redirect(302, '/dashboard');
	}

	return {
		user: result.user
	};
};
