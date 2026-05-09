import { describe, it, expect } from 'vitest';
import { passwordResetSchema, passwordForgotSchema } from '$lib/schemas/password';

describe('passwordResetSchema', () => {
	const validData = {
		password: 'newpassword123',
		confirmPassword: 'newpassword123'
	};

	it('validates correct data', () => {
		const result = passwordResetSchema.safeParse(validData);
		expect(result.success).toBe(true);
	});

	it('rejects short password', () => {
		const result = passwordResetSchema.safeParse({ ...validData, password: 'short', confirmPassword: 'short' });
		expect(result.success).toBe(false);
	});

	it('rejects mismatched passwords', () => {
		const result = passwordResetSchema.safeParse({ ...validData, confirmPassword: 'different123' });
		expect(result.success).toBe(false);
		if (!result.success) {
			const confirmError = result.error.issues.find((i) => i.path.includes('confirmPassword'));
			expect(confirmError).toBeDefined();
			expect(confirmError!.message).toBe('Passwords do not match');
		}
	});
});

describe('passwordForgotSchema', () => {
	it('validates correct email', () => {
		const result = passwordForgotSchema.safeParse({ email: 'user@example.com' });
		expect(result.success).toBe(true);
	});

	it('rejects invalid email', () => {
		const result = passwordForgotSchema.safeParse({ email: 'not-an-email' });
		expect(result.success).toBe(false);
	});

	it('rejects missing email', () => {
		const result = passwordForgotSchema.safeParse({});
		expect(result.success).toBe(false);
	});
});
