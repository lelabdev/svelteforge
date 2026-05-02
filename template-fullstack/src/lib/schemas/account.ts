import { z } from 'zod/v4';

/**
 * Factory for boolean confirmation schemas
 */
function confirmationSchema(message: string) {
	return z.object({
		confirm: z
			.boolean({ error: () => 'Confirmation is required' })
			.refine((val) => val === true, { message })
	});
}

/**
 * Schema for scheduling account deletion
 */
export const scheduleDeletionSchema = confirmationSchema('You must confirm account deletion');

/**
 * Schema for cancelling account deletion
 */
export const cancelDeletionSchema = confirmationSchema('You must confirm the cancellation');

/**
 * Inferred types from schemas
 */
export type ScheduleDeletionInput = z.infer<typeof scheduleDeletionSchema>;
export type CancelDeletionInput = z.infer<typeof cancelDeletionSchema>;
