import { dev } from '$app/environment';
import { fail, redirect } from '@sveltejs/kit';
import { auth } from '$lib/server/auth';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request }) => {
		if (!dev) {
			throw redirect(302, '/login');
		}

		const data = await request.formData();
		const name = data.get('name') as string;
		const email = data.get('email') as string;
		const password = data.get('password') as string;

		if (!name || !email || !password) {
			return fail(400, { error: 'All fields are required' });
		}

		if (password.length < 8) {
			return fail(400, { error: 'Password must be at least 8 characters' });
		}

		try {
			await auth.api.signUpEmail({
				body: { name, email, password }
			});
		} catch (e: unknown) {
			const message = e instanceof Error ? e.message : 'Failed to create admin';
			return fail(400, { error: message });
		}

		throw redirect(302, '/login');
	}
};
