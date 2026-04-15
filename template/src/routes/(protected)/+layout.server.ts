import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { requireAuth, isAuthError } from '$lib/auth-utils';

export const load: LayoutServerLoad = async (event) => {
	// Verify authentication
	const session = await requireAuth(event);
	if (isAuthError(session)) {
		redirect(302, '/login');
	}

	return {
		session
	};
};
