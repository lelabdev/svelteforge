import { redirect } from '@sveltejs/kit';
import { auth } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { user } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { loginSchema } from '$lib/server/schemas';
import { fail, type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.session) {
		throw redirect(302, '/admin');
	}
};

export const actions: Actions = {
	default: async ({ request }) => {
		const formData = await request.formData();
		const parsed = loginSchema.safeParse({
			email: formData.get('email'),
			password: formData.get('password')
		});

		if (!parsed.success) {
			return fail(400, { message: parsed.error.issues[0]?.message ?? 'Invalid input' });
		}

		const { email, password } = parsed.data;
		const [identity] = await db
			.select({ disabled: user.disabled })
			.from(user)
			.where(eq(user.email, email.toLowerCase()))
			.limit(1);
		if (identity?.disabled) {
			// Use the same generic response as bad credentials: account status is private.
			return fail(401, { message: 'Invalid credentials' });
		}

		try {
			await auth.api.signInEmail({
				body: { email, password },
				headers: request.headers
			});
			return { success: true };
		} catch {
			// Generic message — never leak e.message internals to the UI (#188).
			return fail(401, { message: 'Invalid credentials' });
		}
	}
};
