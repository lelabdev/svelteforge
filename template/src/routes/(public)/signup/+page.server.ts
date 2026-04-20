import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { fail, redirect } from '@sveltejs/kit';
import { auth } from '$lib/auth';
import { logger } from '$lib/logger';
import { signupSchema } from '$lib/schemas/signup';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const form = await superValidate(
		{
			email: '',
			password: '',
			name: ''
		},
		zod4(signupSchema)
	);

	return { form };
};

export const actions: Actions = {
	default: async ({ request }) => {
		const form = await superValidate(request, zod4(signupSchema));

		logger.debug(
			{ valid: form.valid, errors: form.errors, email: form.data.email },
			'Signup form validation result'
		);

		if (!form.valid) {
			return fail(400, { form });
		}

		const { email, password, name } = form.data;

		logger.debug({ email, name }, 'Processing signup request');

		try {
			// Create user via BetterAuth
			const authResult = await auth.api.signUpEmail({
				body: {
					email,
					password,
					name
				}
			} as any);

			if (!authResult.user) {
				logger.error({ email }, 'Failed to create user via BetterAuth');
				return fail(500, { form, message: 'Failed to create account' });
			}

			logger.info({ userId: authResult.user.id, email }, 'User created successfully');

			redirect(302, '/dashboard');
		} catch (error) {
			// Check if it's a redirect
			if (
				error &&
				typeof error === 'object' &&
				'status' in error &&
				'location' in error &&
				(error as any).status >= 300 &&
				(error as any).status < 400
			) {
				throw error;
			}

			logger.error({ email, error }, 'Signup error');
			return fail(500, { form, message: 'Failed to create account' });
		}
	}
};
