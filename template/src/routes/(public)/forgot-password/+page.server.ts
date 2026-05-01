import { superValidate, message } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { fail } from '@sveltejs/kit';
import { auth } from '$lib/auth';
import { logger } from '$lib/logger';
import { forgotPasswordSchema } from '$lib/schemas/password';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	// Return an empty form with default values
	const form = await superValidate(zod4(forgotPasswordSchema));
	return { form };
};

export const actions: Actions = {
	default: async ({ request, url }) => {
		const form = await superValidate(request, zod4(forgotPasswordSchema));

		if (!form.valid) {
			logger.debug({ errors: form.errors }, 'Forgot password form validation failed');
			return fail(400, { form });
		}

		const { email } = form.data;

		logger.debug({ email }, 'Processing forgot password request');

		try {
			// Request password reset via BetterAuth API
			await auth.api.forgetPassword({
				body: { email, redirectTo: `${url.origin}/reset-password` }
			});

			logger.info({ email }, 'Password reset email sent successfully');

			// Return success message
			return { form, success: true };
		} catch (error) {
			logger.error({ email, error }, 'Forgot password error');
			return message(form, 'Failed to send recovery email', { status: 500 });
		}
	}
};
