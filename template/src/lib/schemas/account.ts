import { z } from 'zod/v4';

/**
 * Schema for scheduling account deletion
 */
export const scheduleDeletionSchema = z.object({
	confirm: z
		.boolean({
			error: () => 'Confirmation is required'
		})
		.refine((val) => val === true, {
			message: 'You must confirm account deletion'
		})
});

/**
 * Schema for cancelling account deletion
 */
export const cancelDeletionSchema = z.object({
	confirm: z
		.boolean({
			error: () => 'Confirmation is required'
		})
		.refine((val) => val === true, {
			message: 'You must confirm the cancellation'
		})
});

/**
 * Inferred types from schemas
 */
export type ScheduleDeletionInput = z.infer<typeof scheduleDeletionSchema>;
export type CancelDeletionInput = z.infer<typeof cancelDeletionSchema>;
