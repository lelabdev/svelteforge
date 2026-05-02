import { superValidate, message } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { fail, redirect, isRedirect } from '@sveltejs/kit';
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
			{ valid: form.valid, errors: form.errors, data: form.data },
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
				return message(form, 'Failed to create account', { status: 500 });
			}

			logger.info({ userId: authResult.user.id, email }, 'User created successfully');

			redirect(302, '/dashboard');
		} catch (error) {
			if (isRedirect(error)) throw error;

			logger.error({ email, error }, 'Signup error');
			return message(form, 'Failed to create account', { status: 500 });
		}
	}
};
