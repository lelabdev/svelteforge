import { superValidate, message } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { fail, redirect } from '@sveltejs/kit';
import { auth } from '$lib/auth';
import { logger } from '$lib/logger';
import { loginSchema } from '$lib/schemas/login';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const form = await superValidate(zod4(loginSchema));
	return { form };
};

export const actions: Actions = {
	default: async ({ request }) => {
		const form = await superValidate(request, zod4(loginSchema));

		if (!form.valid) {
			logger.debug({ errors: form.errors, email: form.data.email }, 'Login form validation failed');
			return fail(400, { form });
		}

		const { email, password, rememberMe } = form.data;

		logger.debug({ email, rememberMe }, 'Processing login request');

		try {
			const result = await auth.api.signInEmail({
				body: { email, password, rememberMe }
			});

			if (!result.user) {
				logger.warn({ email }, 'Login failed: invalid credentials');
				return message(form, 'Invalid email or password', { status: 400 });
			}

			logger.info({ userId: result.user.id, email }, 'User logged in successfully');

			// Redirect based on role
			if (result.user.role === 'admin') {
				redirect(302, '/admin');
			} else {
				redirect(302, '/dashboard');
			}
		} catch (error) {
			// Check if it's a Redirect exception (which should be re-thrown)
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

			const errObj = error as any;
			const statusCode = errObj?.statusCode ?? errObj?.status;

			if (statusCode === 401 || statusCode === 403) {
				logger.warn({ email, error }, 'Login failed: invalid credentials');
				return message(form, 'Invalid email or password', { status: 400 });
			}

			logger.error({ email, error }, 'Login error');
			return message(form, 'An error occurred during sign in. Please try again.', {
				status: 500
			});
		}
	}
};
