import { auth } from '$lib/server/auth';
import { fail, type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	return {
		user: locals.user!
	};
};

export const actions: Actions = {
	changePassword: async ({ request }) => {
		const formData = await request.formData();
		const currentPassword = formData.get('currentPassword')?.toString();
		const newPassword = formData.get('newPassword')?.toString();

		if (!currentPassword || !newPassword) {
			return fail(400, { message: 'Both passwords are required' });
		}

		try {
			await auth.api.changePassword({
				headers: request.headers,
				body: { currentPassword, newPassword }
			});
			return { success: true };
		} catch (e: any) {
			return fail(400, { message: e.message || 'Failed to change password' });
		}
	}
};
