import { z } from 'zod/v4';

/**
 * Schema for updating user profile
 */
export const updateProfileSchema = z.object({
	name: z.string().min(1, { error: 'Name is required' }).max(50, { error: 'Name too long' }).trim(),
	email: z.string().email({ error: 'Invalid email' }).optional(),
	image: z.string().url({ error: 'Invalid URL' }).optional()
});

/**
 * Inferred types from schemas
 */
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
