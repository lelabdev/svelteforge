import { fail, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { accountSchema, changePasswordSchema } from '$lib/schemas';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ parent }) => {
	const { user } = await parent();

	const profileForm = await superValidate(
		{ name: user.name ?? '', email: user.email },
		zod4(accountSchema)
	);
	const passwordForm = await superValidate(zod4(changePasswordSchema));

	return {
		profileForm,
		passwordForm
	};
};

export const actions: Actions = {
	profile: async ({ request }) => {
		const form = await superValidate(request, zod4(accountSchema));
		if (!form.valid) return fail(400, { form });

		// TODO: Wire up better-auth updateProfile at install time
		// Example:
		// const result = await authClient.updateUser({ name: form.data.name, email: form.data.email });
		// if (result.error) return setError(form, '', result.error.message || 'Could not update profile');

		return { form };
	},

	password: async ({ request }) => {
		const form = await superValidate(request, zod4(changePasswordSchema));
		if (!form.valid) return fail(400, { form });

		// TODO: Wire up better-auth changePassword at install time
		// Example:
		// const result = await authClient.changePassword({
		//   currentPassword: form.data.currentPassword,
		//   newPassword: form.data.password
		// });
		// if (result.error) return setError(form, '', result.error.message || 'Could not change password');

		return { form };
	}
};
