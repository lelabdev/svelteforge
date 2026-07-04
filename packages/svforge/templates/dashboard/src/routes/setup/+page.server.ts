import { dev } from '$app/environment';
import { fail, redirect } from '@sveltejs/kit';
import { auth } from '$lib/server/auth';
import { setupSchema } from '$lib/server/schemas';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request }) => {
		if (!dev) {
			throw redirect(302, '/login');
		}

		const formData = await request.formData();
		const parsed = setupSchema.safeParse({
			name: formData.get('name'),
			email: formData.get('email'),
			password: formData.get(' + 'password')
		});

		if (!parsed.success) {
			return fail(400, { error: parsed.error.issues[0]?.message ?? 'Invalid input' });
		}

		const { name, email, password } = parsed.data;

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
