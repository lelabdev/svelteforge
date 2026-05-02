/**
 * account/core.ts - Shared functions used by all account services
 *
 * Core utilities for user existence checks, retrieval, and admin verification.
 * These functions avoid code duplication across services.
 */

import { db } from '$lib/db';
import { user } from '$lib/db/schemas';
import { eq } from 'drizzle-orm';
import { logger, logError } from '$lib/logger';
import { NotFoundError, InternalError } from '$lib/errors';
import type { QueryRunner } from '$lib/db/types';
import type { User } from '$lib/db/schemas';

// Re-export types for convenience
export type { User };

// ============================================================================
// HELPER
// ============================================================================

/**
 * Fetch a user by ID, throw NotFoundError if missing, then run `fn`.
 * Handles try/catch + logError + InternalError boilerplate.
 */
export async function withUser<T>(
	userId: string,
	context: string,
	fn: (existing: User) => Promise<T>
): Promise<T> {
	const [existing] = await db.select().from(user).where(eq(user.id, userId)).limit(1);
	if (!existing) throw new NotFoundError('User not found');
	try {
		return await fn(existing);
	} catch (error) {
		if (error instanceof NotFoundError) throw error;
		logError(error as Error, { userId, context });
		throw new InternalError(`Error in ${context}`, error);
	}
}

// ============================================================================
// USER EXISTENCE
// ============================================================================

/**
 * Check if a user exists
 * The tx argument supports transactions
 */
export async function userExists(userId: string, tx: QueryRunner = db): Promise<boolean> {
	try {
		const [existing] = await tx
			.select({ id: user.id })
			.from(user)
			.where(eq(user.id, userId))
			.limit(1);
		return !!existing;
	} catch (error) {
		logError(error as Error, { userId, context: 'userExists' });
		return false;
	}
}

// ============================================================================
// USER RETRIEVAL
// ============================================================================

/**
 * Get a user by their ID
 */
export async function getUserById(userId: string): Promise<User | null> {
	logger.debug({ userId }, 'Getting user by ID');

	try {
		const [userData] = await db.select().from(user).where(eq(user.id, userId)).limit(1);

		if (!userData) {
			return null;
		}

		return userData;
	} catch (error) {
		logError(error as Error, { userId, context: 'getUserById' });
		throw new Error('Error retrieving user');
	}
}

// ============================================================================
// ANONYMIZATION
// ============================================================================

/**
 * Anonymize a user's personal data
 * Shared by account management for user deletion
 */
export async function anonymizeUser(userId: string, tx: QueryRunner): Promise<void> {
	const ANONYMIZED_NAME = 'Deleted';
	const ANONYMIZED_EMAIL_DOMAIN = 'no-reply.deleted';

	const randomSuffix = Math.floor(Math.random() * 10000)
		.toString()
		.padStart(4, '0');
	const anonymizedEmail = `deleted-${randomSuffix}@${ANONYMIZED_EMAIL_DOMAIN}`;

	await tx
		.update(user)
		.set({
			name: ANONYMIZED_NAME,
			email: anonymizedEmail,
			image: null,
			emailVerified: false,
			updatedAt: new Date()
		})
		.where(eq(user.id, userId));

	logger.info({ userId }, 'User data anonymized');
}

// ============================================================================
// ADMIN CHECKS
// ============================================================================

/**
 * Check if a user is admin
 */
export async function isAdmin(userId: string): Promise<boolean> {
	logger.debug({ userId }, 'Checking if user is admin');

	try {
		const [userData] = await db
			.select({ role: user.role })
			.from(user)
			.where(eq(user.id, userId))
			.limit(1);
		return userData?.role === 'admin';
	} catch (error) {
		logError(error as Error, { userId, context: 'isAdmin' });
		throw new Error('Error checking user role');
	}
}

// ============================================================================
// EMAIL / PHONE CHECKS
// ============================================================================

/**
 * Check if an email already exists
 */
export async function emailExists(email: string): Promise<boolean> {
	logger.debug({ email }, 'Checking if email exists');

	try {
		const [existingUser] = await db
			.select({ id: user.id })
			.from(user)
			.where(eq(user.email, email))
			.limit(1);

		return !!existingUser;
	} catch (error) {
		logError(error as Error, { email, context: 'emailExists' });
		throw new Error('Error checking email');
	}
}

/**
 * Check if a phone number already exists
 */
export async function phoneExists(phoneNumber: string): Promise<boolean> {
	logger.debug({ phoneNumber }, 'Checking if phone exists');

	try {
		const [existingUser] = await db
			.select({ id: user.id })
			.from(user)
			.where(eq(user.phoneNumber, phoneNumber))
			.limit(1);

		return !!existingUser;
	} catch (error) {
		logError(error as Error, { phoneNumber, context: 'phoneExists' });
		throw new Error('Error checking phone number');
	}
}
