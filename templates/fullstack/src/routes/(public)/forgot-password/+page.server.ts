import { fail } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { message } from 'sveltekit-superforms';
import { passwordForgotSchema } from '$lib/schemas';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async () => {
	return {
		form: await superValidate(zod4(passwordForgotSchema))
	};
};

export const actions: Actions = {
	default: async ({ request }) => {
		const form = await superValidate(request, zod4(passwordForgotSchema));
		if (!form.valid) return fail(400, { form });

		const { email } = form.data;

		// TODO: Wire up better-auth password reset at install time
		// Example:
		// await authClient.forgetPassword({ email, redirectTo: '/reset-password' });

		// Mock: always return success to avoid leaking registered emails
		return message(form, 'If an account exists with that email, a reset link has been sent.');
	}
};
