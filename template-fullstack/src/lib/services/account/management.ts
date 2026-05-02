/**
 * account/management.ts - Admin user management
 *
 * Functions for disabling, enabling, and deleting user accounts.
 * All operations use the core user table only (no profile dependency).
 */

import { db } from '$lib/db';
import { user } from '$lib/db/schemas';
import { eq } from 'drizzle-orm';
import { logger } from '$lib/logger';
import { withUser, anonymizeUser } from './core';
import type { QueryRunner } from '$lib/db/types';

// ============================================================================
// PUBLIC FUNCTIONS
// ============================================================================

/**
 * Disable a user account (admin action)
 * Prevents login but keeps all data
 */
export async function disableUser(userId: string, adminId: string): Promise<void> {
	await withUser(userId, 'disableUser', async () => {
		logger.info({ userId, adminId }, 'Admin disabling user account');

		await db
			.update(user)
			.set({
				banned: true,
				banReason: 'Disabled by admin',
				updatedAt: new Date()
			})
			.where(eq(user.id, userId));

		logger.info({ userId, adminId }, 'User account disabled by admin');
	});
}

/**
 * Re-enable a user account (admin action)
 */
export async function enableUser(userId: string, adminId: string): Promise<void> {
	await withUser(userId, 'enableUser', async () => {
		logger.info({ userId, adminId }, 'Admin enabling user account');

		await db
			.update(user)
			.set({
				banned: false,
				banReason: null,
				updatedAt: new Date()
			})
			.where(eq(user.id, userId));

		logger.info({ userId, adminId }, 'User account enabled by admin');
	});
}

/**
 * Immediately delete a user account (admin action)
 * Anonymizes data without delay
 */
export async function deleteUserImmediate(userId: string, adminId: string): Promise<void> {
	await withUser(userId, 'deleteUserImmediate', async () => {
		logger.info({ userId, adminId }, 'Admin deleting user account immediately');

		await db.transaction(async (tx: QueryRunner) => {
			await anonymizeUser(userId, tx);
		});

		logger.info({ userId, adminId }, 'User account deleted immediately by admin');
	});
}
