/**
 * account/management.ts - Admin user management
 *
 * Functions for disabling, enabling, and deleting user accounts.
 * All operations use the core user table only (no profile dependency).
 */

import { db } from '$lib/db';
import { user } from '$lib/db/schemas';
import { eq, and, ne } from 'drizzle-orm';
import { logger, logError } from '$lib/logger';
import { NotFoundError, ValidationError, InternalError } from '$lib/errors';
import type { QueryRunner } from '$lib/db/types';
import { userExists, anonymizeUser } from './core';

// ============================================================================
// PUBLIC FUNCTIONS
// ============================================================================

/**
 * Disable a user account (admin action)
 * Prevents login but keeps all data
 *
 * @param userId - ID of the user to disable
 * @param adminId - ID of the admin performing the action
 * @throws NotFoundError if the user does not exist
 */
export async function disableUser(userId: string, adminId: string): Promise<void> {
	try {
		logger.info({ userId, adminId }, 'Admin disabling user account');

		// Check that the user exists
		const [targetUser] = await db
			.select({ id: user.id, email: user.email })
			.from(user)
			.where(eq(user.id, userId))
			.limit(1);

		if (!targetUser) {
			throw new NotFoundError('User not found');
		}

		// Disable the account using the banned flag
		await db
			.update(user)
			.set({
				banned: true,
				banReason: 'Disabled by admin',
				updatedAt: new Date()
			})
			.where(eq(user.id, userId));

		logger.info({ userId, adminId }, 'User account disabled by admin');
	} catch (error) {
		if (error instanceof NotFoundError) {
			throw error;
		}
		logError(error as Error, { userId, adminId, context: 'disableUser' });
		throw new InternalError('Failed to disable user account', error);
	}
}

/**
 * Re-enable a user account (admin action)
 *
 * @param userId - ID of the user to re-enable
 * @param adminId - ID of the admin performing the action
 * @throws NotFoundError if the user does not exist
 */
export async function enableUser(userId: string, adminId: string): Promise<void> {
	try {
		logger.info({ userId, adminId }, 'Admin enabling user account');

		// Check that the user exists
		const [targetUser] = await db
			.select({ id: user.id })
			.from(user)
			.where(eq(user.id, userId))
			.limit(1);

		if (!targetUser) {
			throw new NotFoundError('User not found');
		}

		// Re-enable the account
		await db
			.update(user)
			.set({
				banned: false,
				banReason: null,
				updatedAt: new Date()
			})
			.where(eq(user.id, userId));

		logger.info({ userId, adminId }, 'User account enabled by admin');
	} catch (error) {
		if (error instanceof NotFoundError) {
			throw error;
		}
		logError(error as Error, { userId, adminId, context: 'enableUser' });
		throw new InternalError('Failed to enable user account', error);
	}
}

/**
 * Immediately delete a user account (admin action)
 * Anonymizes data without delay
 *
 * @param userId - ID of the user to delete
 * @param adminId - ID of the admin performing the action
 * @throws NotFoundError if the user does not exist
 */
export async function deleteUserImmediate(userId: string, adminId: string): Promise<void> {
	try {
		logger.info({ userId, adminId }, 'Admin deleting user account immediately');

		// Check that the user exists
		const [targetUser] = await db
			.select({ id: user.id, email: user.email })
			.from(user)
			.where(eq(user.id, userId))
			.limit(1);

		if (!targetUser) {
			throw new NotFoundError('User not found');
		}

		// Anonymize in a transaction
		await db.transaction(async (tx: QueryRunner) => {
			await anonymizeUser(userId, tx);
		});

		logger.info({ userId, adminId }, 'User account deleted immediately by admin');
	} catch (error) {
		if (error instanceof NotFoundError) {
			throw error;
		}
		logError(error as Error, { userId, adminId, context: 'deleteUserImmediate' });
		throw new InternalError('Failed to delete user account', error);
	}
}
