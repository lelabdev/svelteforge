import { fail, redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { signupSchema } from '$lib/schemas';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	// Redirect to dashboard if already logged in
	if (locals.user) {
		redirect(302, '/dashboard');
	}

	return {
		form: await superValidate(zod4(signupSchema))
	};
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const form = await superValidate(request, zod4(signupSchema));
		if (!form.valid) return fail(400, { form });

		const { name, email, password } = form.data;

		// TODO: Wire up better-auth sign-up at install time
		// Example:
		// const result = await authClient.signUp.email({ email, password, name });
		// if (result.error) {
		//   return setError(form, '', result.error.message || 'Could not create account');
		// }

		// Placeholder: redirect on success
		throw redirect(303, '/dashboard');
	}
};
