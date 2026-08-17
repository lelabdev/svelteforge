import { db } from '$lib/server/db';
import { user, account, session } from '$lib/server/db/schema';
import { desc, eq } from 'drizzle-orm';
import { fail, redirect, error, type Actions } from '@sveltejs/kit';
import { isAdmin } from '$lib/server/admin';
import { createCredentialUser, DuplicateEmailError } from '$lib/server/admin-users';
import { createUserSchema, updateUserSchema, deleteUserSchema, toggleVerifySchema } from '$lib/server/schemas';
import type { PageServerLoad } from './$types';
import type { RequestEvent } from '@sveltejs/kit';

/**
 * Require an authenticated admin user for a form action.
 * Returns the user id on success, or throws a 401/403 error.
 *
 * Every admin action must call this BEFORE reading formData or touching the db.
 */
async function requireAdmin(event: RequestEvent): Promise<string> {
	if (!event.locals.user) {
		throw error(401, { message: 'Authentication required' });
	}
	if (!(await isAdmin(event.locals.user.id))) {
		throw error(403, { message: 'Admin access required' });
	}
	return event.locals.user.id;
}

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user || !(await isAdmin(locals.user.id))) {
		throw redirect(302, '/login');
	}

	const users = await db.select({
		id: user.id,
		name: user.name,
		email: user.email,
		emailVerified: user.emailVerified,
		image: user.image,
		createdAt: user.createdAt
	}).from(user).orderBy(desc(user.createdAt));

	return { users };
};

/**
 * Form actions (#295) — golden reference for SvelteKit mutations.
 *
 * Every action returns a STABLE machine-readable `code` instead of English
 * copy: the UI maps codes to Paraglide FR/EN messages, so no visible text
 * comes from the server and the copy can never leak internal details.
 */

export const actions: Actions = {
	create: async (event) => {
		await requireAdmin(event);
		const { request } = event;
		const formData = await request.formData();
		const parsed = createUserSchema.safeParse({
			name: formData.get('name'),
			email: formData.get('email'),
			password: formData.get('password')
		});

		if (!parsed.success) {
			return fail(400, { code: 'invalid_input' });
		}

		const { name, email, password } = parsed.data;

		try {
			// Contract-compliant credential user: lowercase email, accountId = userId,
			// user + credential account created atomically, admin session untouched.
			// (signUpEmail is NOT used: it sets a session cookie for the new user,
			// which would silently replace the admin's own session.)
			await createCredentialUser({ name, email, password });
		} catch (error) {
			if (error instanceof DuplicateEmailError) {
				return fail(400, { code: 'email_exists' });
			}
			// Generic code — never leak e.message internals to the UI (#188).
			return fail(500, { code: 'create_failed' });
		}

		return { success: true, code: 'created' };
	},

	update: async (event) => {
		await requireAdmin(event);
		const { request } = event;
		const formData = await request.formData();
		const parsed = updateUserSchema.safeParse({
			id: formData.get('id'),
			name: formData.get('name'),
			email: formData.get('email')
		});

		if (!parsed.success) {
			return fail(400, { code: 'invalid_input' });
		}

		const { id, name, email } = parsed.data;
		const normalizedEmail = email.toLowerCase();

		// Check email not taken by another user (case-insensitive, matching the
		// lowercase credential contract of the create helper — #292).
		const [existing] = await db
			.select({ id: user.id })
			.from(user)
			.where(eq(user.email, normalizedEmail))
			.limit(1);
		if (existing && existing.id !== id) {
			return fail(400, { code: 'email_taken' });
		}

		try {
			await db.update(user).set({
				name,
				email: normalizedEmail,
				updatedAt: new Date()
			}).where(eq(user.id, id));
		} catch {
			// Generic code — never leak e.message internals to the UI (#188).
			return fail(500, { code: 'update_failed' });
		}

		return { success: true, code: 'updated' };
	},

	delete: async (event) => {
		const adminId = await requireAdmin(event);
		const { request } = event;
		const formData = await request.formData();
		const parsed = deleteUserSchema.safeParse({
			id: formData.get('id')
		});

		if (!parsed.success) {
			return fail(400, { code: 'invalid_input' });
		}

		const { id } = parsed.data;

		// Prevent self-delete
		if (id === adminId) {
			return fail(400, { code: 'self_delete' });
		}

		// Verify the target user exists before attempting deletion
		const [target] = await db.select({ id: user.id }).from(user).where(eq(user.id, id)).limit(1);
		if (!target) {
			return fail(404, { code: 'not_found' });
		}

		// Atomic deletion: session → account → user (FK-safe order)
		// All deletions succeed or none do.
		try {
			await db.transaction(async (tx) => {
				await tx.delete(session).where(eq(session.userId, id));
				await tx.delete(account).where(eq(account.userId, id));
				await tx.delete(user).where(eq(user.id, id));
			});
		} catch {
			// Generic code — never leak e.message internals to the UI (#188).
			return fail(500, { code: 'delete_failed' });
		}

		return { success: true, code: 'deleted' };
	},

	toggleVerify: async (event) => {
		await requireAdmin(event);
		const { request } = event;
		const formData = await request.formData();
		const parsed = toggleVerifySchema.safeParse({
			id: formData.get('id'),
			verified: formData.get('verified') === 'true'
		});

		if (!parsed.success) {
			return fail(400, { code: 'invalid_input' });
		}

		const { id, verified } = parsed.data;

		try {
			await db.update(user).set({
				emailVerified: !verified,
				updatedAt: new Date()
			}).where(eq(user.id, id));
		} catch {
			// Generic code — never leak e.message internals to the UI (#188).
			return fail(500, { code: 'verify_failed' });
		}

		return { success: true, code: verified ? 'unverified' : 'verified' };
	}
};
