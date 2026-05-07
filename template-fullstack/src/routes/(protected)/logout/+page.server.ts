import { redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { auth } from '$lib/server/auth';

export const actions: Actions = {
	default: async (event) => {
		await auth.api.signOut({
			headers: event.request.headers
		});
		throw redirect(302, '/login');
	}
};
