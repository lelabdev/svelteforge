import { fail } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { message } from 'sveltekit-superforms';
import { passwordResetSchema } from '$lib/schemas';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async () => {
	return {
		form: await superValidate(zod4(passwordResetSchema))
	};
};

export const actions: Actions = {
	default: async ({ request }) => {
		const form = await superValidate(request, zod4(passwordResetSchema));
		if (!form.valid) return fail(400, { form });

		const { password } = form.data;

		// TODO: Wire up better-auth password reset confirmation at install time
		// Example:
		// const result = await authClient.resetPassword({ newPassword: password, token });
		// if (result.error) {
		//   return setError(form, '', result.error.message || 'Failed to reset password');
		// }

		// Mock: return success message
		return message(form, 'Your password has been reset successfully.');
	}
};
