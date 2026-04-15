import { z } from 'zod/v4';

/**
 * Schema for user signup
 */
export const signupSchema = z.object({
	email: z.string().email({ error: 'Invalid email' }).min(1, { error: 'Email is required' }),
	password: z.string().min(8, { error: 'Min. 8 characters' }).default(''),
	name: z.string().trim().min(1, { error: 'Name is required' }).default('')
});

/**
 * Inferred types from schemas
 */
export type SignupInput = z.infer<typeof signupSchema>;
