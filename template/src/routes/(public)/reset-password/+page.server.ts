import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { fail, redirect } from '@sveltejs/kit';
import { auth } from '$lib/auth';
import { logger } from '$lib/logger';
import { resetPasswordSchema } from '$lib/schemas/password';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	// Get token from URL query params
	const token = url.searchParams.get('token');

	// Return an empty form with default values
	const form = await superValidate(zod4(resetPasswordSchema));
	return { form, token };
};

export const actions: Actions = {
	default: async ({ request, url }) => {
		const form = await superValidate(request, zod4(resetPasswordSchema));

		if (!form.valid) {
			logger.debug({ errors: form.errors }, 'Reset password form validation failed');
			return fail(400, { form });
		}

		const { password } = form.data;
		const token = url.searchParams.get('token');

		if (!token) {
			logger.warn({}, 'Reset password attempted without token');
			return fail(400, { form, message: 'Reset token is missing' });
		}

		logger.debug({}, 'Processing reset password request');

		try {
			// Reset password via BetterAuth API
			await auth.api.resetPassword({
				body: { newPassword: password },
				query: { token }
			});

			logger.info({}, 'Password reset successfully');

			// Redirect to login with success message
			redirect(302, '/login?reset=true');
		} catch (error) {
			logger.error({ error }, 'Reset password error');
			return fail(500, { form, message: 'Failed to reset password' });
		}
	}
};
