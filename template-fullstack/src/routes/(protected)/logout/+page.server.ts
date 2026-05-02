import { redirect } from '@sveltejs/kit';
import { auth } from '$lib/auth';
import { logger } from '$lib/logger';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request }) => {
		try {
			// Sign out via BetterAuth API
			await auth.api.signOut({
				headers: request.headers
			});

			logger.info({}, 'User logged out successfully');
		} catch (error) {
			logger.error({ error }, 'Logout error');
			// Continue with redirect even if logout fails
		}

		// Always redirect to login after logout attempt
		redirect(302, '/login');
	}
};
