/**
 * account/updates.ts - User data updates
 *
 * Functions for updating user information.
 * All operations use the core user table only.
 */

import { db } from '$lib/db';
import { user } from '$lib/db/schemas';
import { eq, and, ne } from 'drizzle-orm';
import { NotFoundError, ConflictError, InternalError } from '$lib/errors';
import { logger, logError } from '$lib/logger';
import type { UpdateUserAsAdminData } from '$lib/types';

// ============================================================================
// TYPES
// ============================================================================

// Re-export types for convenience
export type { UpdateUserAsAdminData };

// ============================================================================
// ADMIN USER UPDATE FUNCTIONS
// ============================================================================

/**
 * Update a user's information (admin only)
 */
export async function updateUserAsAdmin(
	userId: string,
	data: UpdateUserAsAdminData
): Promise<typeof user.$inferSelect> {
	logger.debug({ userId, data }, 'Updating user as admin');

	try {
		// Check that the user exists
		const [existingUser] = await db
			.select({ id: user.id, email: user.email })
			.from(user)
			.where(eq(user.id, userId))
			.limit(1);

		if (!existingUser) {
			logger.warn({ userId }, 'User not found');
			throw new NotFoundError('User not found');
		}

		// Check email uniqueness if changed
		if (data.email && data.email !== existingUser.email) {
			const [emailConflict] = await db
				.select({ id: user.id })
				.from(user)
				.where(and(eq(user.email, data.email), ne(user.id, userId)))
				.limit(1);

			if (emailConflict) {
				logger.warn({ userId, email: data.email }, 'Email already in use');
				throw new ConflictError('This email is already in use');
			}
		}

		// Build update payload
		const updateData: Partial<typeof user.$inferInsert> = {};
		if (data.name !== undefined) updateData.name = data.name;
		if (data.email !== undefined) updateData.email = data.email;

		// Update user
		await db.update(user).set(updateData).where(eq(user.id, userId));

		// Retrieve updated user
		const [updatedUser] = await db.select().from(user).where(eq(user.id, userId)).limit(1);

		if (!updatedUser) {
			throw new InternalError('Error retrieving updated user');
		}

		logger.info({ userId }, 'User updated successfully by admin');
		return updatedUser;
	} catch (error) {
		if (error instanceof NotFoundError || error instanceof ConflictError) {
			throw error;
		}
		logError(error as Error, { userId, data, context: 'updateUserAsAdmin' });
		throw new InternalError('Error updating user', error);
	}
}

/**
 * Update a user's name
 */
export async function updateUserName(userId: string, name: string): Promise<void> {
	logger.debug({ userId, name }, 'Updating user name');

	try {
		await db.update(user).set({ name, updatedAt: new Date() }).where(eq(user.id, userId));
		logger.info({ userId }, 'User name updated successfully');
	} catch (error) {
		logError(error as Error, { userId, name, context: 'updateUserName' });
		throw new InternalError('Error updating name', error);
	}
}


