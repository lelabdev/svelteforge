import { z } from 'zod/v4';

/**
 * Schema for password reset request
 */
export const forgotPasswordSchema = z.object({
	email: z.email('Invalid email')
});

/**
 * Schema for password reset
 */
export const resetPasswordSchema = z
	.object({
		password: z.string().min(8, { error: 'Min. 8 characters' }),
		confirmPassword: z
			.string()
			.min(1, { error: 'Password confirmation is required' })
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: 'Passwords do not match',
		path: ['confirmPassword']
	});

/**
 * Inferred types from schemas
 */
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
