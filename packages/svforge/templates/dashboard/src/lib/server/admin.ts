import { db } from '$lib/server/db';
import { user } from '$lib/server/db/schema';
import { asc } from 'drizzle-orm';

/**
 * Check if a user is an admin.
 * 
 * This template uses the "first-user-is-admin" pattern.
 * For multi-user scenarios, add a `role` column to the user schema
 * and check it here instead.
 */
// Pattern: first-user-is-admin. The oldest user (by createdAt) is the admin.
// For multi-role scenarios, add a `role` column to the user table and check it here.
export async function isAdmin(userId: string): Promise<boolean> {
	const [firstUser] = await db.select({ id: user.id })
		.from(user)
		.orderBy(asc(user.createdAt))
		.limit(1);
	return firstUser?.id === userId;
}
