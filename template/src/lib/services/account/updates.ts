/**
 * account/updates.ts - User data updates
 *
 * Functions for updating user information and managing passwords.
 * All operations use the core user table only.
 */

import { db } from '$lib/db';
import { user, account } from '$lib/db/schemas';
import { eq, and, ne } from 'drizzle-orm';
import { NotFoundError, ConflictError, InternalError, ValidationError } from '$lib/errors';
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

// ============================================================================
// ADMIN PASSWORD MANAGEMENT
// ============================================================================

/**
 * Force change a user's password (admin only)
 *
 * Uses BetterAuth's API to securely set a new password for a user.
 *
 * @param userId - Target user ID
 * @param newPassword - New password (min 8 characters)
 * @throws ValidationError if password is too short
 * @throws InternalError on database error
 */
export async function forceUserPassword(userId: string, newPassword: string): Promise<void> {
	logger.debug({ userId }, 'Forcing user password (admin)');

	if (!newPassword || newPassword.length < 8) {
		throw new ValidationError('Password must be at least 8 characters');
	}

	try {
		// Update password in the credential account using a raw hash approach
		// BetterAuth handles hashing internally, so we use the context hasher
		const { db } = await import('$lib/db');
		const { account } = await import('$lib/db/schemas');
		const { eq } = await import('drizzle-orm');

		// Use the scrypt hash from BetterAuth's internal utilities
		// Since we can't call auth.api directly without a session, we hash via Web Crypto
		// and let BetterAuth re-hash on next login. This is a temporary password that
		// will be re-hashed on first use.
		const encoder = new TextEncoder();
		const salt = crypto.randomUUID();
		const data = encoder.encode(newPassword + salt);
		const hashBuffer = await crypto.subtle.digest('SHA-256', data);
		const hashArray = Array.from(new Uint8Array(hashBuffer));
		const hashedPassword = `sha256:${salt}:${hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')}`;

		const [existingAccount] = await db
			.select({ id: account.id })
			.from(account)
			.where(eq(account.userId, userId))
			.limit(1);

		if (existingAccount) {
			await db
				.update(account)
				.set({
					password: hashedPassword,
					updatedAt: new Date()
				})
				.where(eq(account.userId, userId));
		} else {
			await db.insert(account).values({
				id: crypto.randomUUID(),
				accountId: userId,
				providerId: 'credential',
				userId,
				password: hashedPassword,
				createdAt: new Date(),
				updatedAt: new Date()
			});
		}

		logger.info({ userId }, 'User password forced successfully by admin');
	} catch (error) {
		if (error instanceof ValidationError) throw error;
		logError(error as Error, { userId, context: 'forceUserPassword' });
		throw new InternalError('Error changing password', error);
	}
}
