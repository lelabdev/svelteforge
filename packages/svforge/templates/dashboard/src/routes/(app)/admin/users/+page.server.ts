import { db } from '$lib/server/db';
import { user, account, session } from '$lib/server/db/schema';
import { desc, eq } from 'drizzle-orm';
import { fail, redirect, error, type Actions } from '@sveltejs/kit';
import { isAdmin } from '$lib/server/admin';
import { createCredentialUser, DuplicateEmailError } from '$lib/server/admin-users';
import { createUserSchema, deleteUserSchema, toggleVerifySchema } from '$lib/server/schemas';
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
			return fail(400, { message: parsed.error.issues[0]?.message ?? 'Invalid input' });
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
				return fail(400, { message: 'Email already exists' });
			}
			// Generic message — never leak e.message internals to the UI (#188).
			return fail(500, { message: 'Failed to create user' });
		}

		return { success: true, message: `User ${name} created` };
	},

	update: async (event) => {
		await requireAdmin(event);
		const { request } = event;
		const formData = await request.formData();
		const id = formData.get('id')?.toString();
		const name = formData.get('name')?.toString()?.trim();
		const email = formData.get('email')?.toString()?.trim()?.toLowerCase();

		if (!id || !name || !email) {
			return fail(400, { message: 'ID, name and email are required' });
		}

		// Check email not taken by another user (case-insensitive, matching the
		// lowercase credential contract of the create helper — #292).
		const [existing] = await db.select({ id: user.id }).from(user).where(eq(user.email, email)).limit(1);
		if (existing && existing.id !== id) {
			return fail(400, { message: 'Email already taken by another user' });
		}

		await db.update(user).set({
			name,
			email,
			updatedAt: new Date()
		}).where(eq(user.id, id));

		return { success: true, message: `User ${name} updated` };
	},

	delete: async (event) => {
		const adminId = await requireAdmin(event);
		const { request } = event;
		const formData = await request.formData();
		const parsed = deleteUserSchema.safeParse({
			id: formData.get('id')
		});

		if (!parsed.success) {
			return fail(400, { message: 'User ID is required' });
		}

		const { id } = parsed.data;

		// Prevent self-delete
		if (id === adminId) {
			return fail(400, { message: 'You cannot delete your own account' });
		}

		// Verify the target user exists before attempting deletion
		const [target] = await db.select({ id: user.id }).from(user).where(eq(user.id, id)).limit(1);
		if (!target) {
			return fail(404, { message: 'User not found' });
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
			// Generic message — never leak e.message internals to the UI (#188).
			return fail(500, { message: 'Failed to delete user' });
		}

		return { success: true, message: 'User deleted' };
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
			return fail(400, { message: 'User ID is required' });
		}

		const { id, verified } = parsed.data;

		await db.update(user).set({
			emailVerified: !verified,
			updatedAt: new Date()
		}).where(eq(user.id, id));

		return { success: true, message: `Email ${!verified ? 'verified' : 'unverified'}` };
	}
};
