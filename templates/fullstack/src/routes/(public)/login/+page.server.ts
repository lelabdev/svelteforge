import { fail, redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { loginSchema } from '$lib/schemas';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	// Redirect to dashboard if already logged in
	if (locals.user) {
		redirect(302, '/dashboard');
	}

	return {
		form: await superValidate(zod4(loginSchema))
	};
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const form = await superValidate(request, zod4(loginSchema));
		if (!form.valid) return fail(400, { form });

		const { email, password } = form.data;

		// TODO: Wire up better-auth sign-in at install time
		// Example:
		// const result = await authClient.signIn.email({ email, password });
		// if (result.error) {
		//   return setError(form, '', result.error.message || 'Invalid credentials');
		// }

		// Placeholder: redirect on success
		throw redirect(303, '/dashboard');
	}
};
