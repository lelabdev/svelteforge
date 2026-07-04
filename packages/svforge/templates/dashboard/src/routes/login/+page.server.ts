import { redirect } from '@sveltejs/kit';
import { auth } from '$lib/server/auth';
import { loginSchema } from '$lib/server/schemas';
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
		const parsed = loginSchema.safeParse({
			email: formData.get('email'),
			password: formData.get('password')
		});

		if (!parsed.success) {
			return fail(400, { message: parsed.error.issues[0]?.message ?? 'Invalid input' });
		}

		const { email, password } = parsed.data;

		try {
			await auth.api.signInEmail({
				body: { email, password },
				headers: request.headers
			});
			return { success: true };
		} catch (e: unknown) {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
			return fail(401, { message: e instanceof Error ? e.message : "Invalid credentials" || 'Invalid credentials' });
		}
	}
};
