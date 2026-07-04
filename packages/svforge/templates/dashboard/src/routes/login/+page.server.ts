import { redirect } from '@sveltejs/kit';
import { auth } from '$lib/server/auth';
import { fail, type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.session) {
		throw redirect(302, '/admin');
	}
};

export const actions: Actions = {
	default: async ({ request }) => {
		const formData = await request.formData();
		const email = formData.get('email')?.toString();
		const password = formData.get('password')?.toString();

		if (!email || !password) {
			return fail(400, { message: 'Email and password are required' });
		}

		try {
			await auth.api.signInEmail({
				body: { email, password },
				headers: request.headers
			});
			return { success: true };
		} catch (e: unknown) {
			return fail(401, { message: e instanceof Error ? e.message : "Invalid credentials" || 'Invalid credentials' });
		}
	}
};
