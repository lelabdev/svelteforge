/**
 * account/roles.ts - Role management and user validation
 *
 * Admin functions for banning users and toggling admin role.
 */

import { db } from '$lib/db';
import { user } from '$lib/db/schemas';
import { eq, sql } from 'drizzle-orm';
import { NotFoundError, ValidationError, InternalError } from '$lib/errors';
import { logger, logError } from '$lib/logger';

// ============================================================================
// ROLE MANAGEMENT FUNCTIONS
// ============================================================================

/**
 * Ban a user (admin only)
 */
export async function banUser(userId: string): Promise<void> {
	logger.debug({ userId }, 'Banning user');

	try {
		// Check that the user exists
		const [existingUser] = await db
			.select({ id: user.id, role: user.role })
			.from(user)
			.where(eq(user.id, userId))
			.limit(1);

		if (!existingUser) {
			logger.warn({ userId }, 'User not found');
			throw new NotFoundError('User not found');
		}

		// Prevent banning an admin
		if (existingUser.role === 'admin') {
			logger.warn({ userId }, 'Cannot ban admin user');
			throw new ValidationError('Cannot ban an administrator');
		}

		// Mark user as banned
		await db
			.update(user)
			.set({ banned: true, banReason: 'Banned by admin', updatedAt: new Date() })
			.where(eq(user.id, userId));

		logger.info({ userId }, 'User banned successfully');
	} catch (error) {
		if (error instanceof NotFoundError || error instanceof ValidationError) {
			throw error;
		}
		logError(error as Error, { userId, context: 'banUser' });
		throw new InternalError('Error during ban', error);
	}
}

/**
 * Toggle admin role for a user (admin only)
 */
export async function toggleAdminRole(userId: string): Promise<{ newRole: string }> {
	logger.debug({ userId }, 'Toggling admin role');

	try {
		// Check that the user exists
		const [existingUser] = await db
			.select({ id: user.id, role: user.role })
			.from(user)
			.where(eq(user.id, userId))
			.limit(1);

		if (!existingUser) {
			logger.warn({ userId }, 'User not found');
			throw new NotFoundError('User not found');
		}

		// Prevent removing the last admin
		if (existingUser.role === 'admin') {
			const [adminCount] = await db
				.select({ count: sql<number>`count(*)` })
				.from(user)
				.where(eq(user.role, 'admin'))
				.limit(1);

			if (adminCount && adminCount.count <= 1) {
				logger.warn({ userId }, 'Cannot remove last admin');
				throw new ValidationError('Cannot remove the last administrator');
			}
		}

		// Toggle role
		const newRole = existingUser.role === 'admin' ? 'user' : 'admin';
		await db.update(user).set({ role: newRole }).where(eq(user.id, userId));

		logger.info({ userId, oldRole: existingUser.role, newRole }, 'User role toggled successfully');
		return { newRole };
	} catch (error) {
		if (error instanceof NotFoundError || error instanceof ValidationError) {
			throw error;
		}
		logError(error as Error, { userId, context: 'toggleAdminRole' });
		throw new InternalError('Error changing role', error);
	}
}
