import { z } from 'zod/v4';

/**
 * Schema for user login
 */
export const loginSchema = z.object({
	email: z.string().email({ error: 'Invalid email' }).min(1, { error: 'Email is required' }),
	password: z.string().min(1, { error: 'Password is required' }).default(''),
	rememberMe: z.boolean().optional().default(true)
});

/**
 * Inferred type from schema
 */
export type LoginInput = z.infer<typeof loginSchema>;
