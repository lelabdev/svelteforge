import { describe, it, expect } from 'vitest';
import { signupSchema } from '$lib/schemas/signup';

describe('signupSchema', () => {
	const validData = {
		email: 'user@example.com',
		password: 'password123',
		confirmPassword: 'password123'
	};

	it('validates correct data', () => {
		const result = signupSchema.safeParse(validData);
		expect(result.success).toBe(true);
	});

	it('validates with optional name', () => {
		const result = signupSchema.safeParse({ ...validData, name: 'John' });
		expect(result.success).toBe(true);
	});

	it('rejects missing email', () => {
		const { email, ...noEmail } = validData;
		const result = signupSchema.safeParse(noEmail);
		expect(result.success).toBe(false);
	});

	it('rejects invalid email', () => {
		const result = signupSchema.safeParse({ ...validData, email: 'not-an-email' });
		expect(result.success).toBe(false);
	});

	it('rejects short password (< 8 chars)', () => {
		const result = signupSchema.safeParse({ ...validData, password: 'short', confirmPassword: 'short' });
		expect(result.success).toBe(false);
	});

	it('rejects mismatched passwords', () => {
		const result = signupSchema.safeParse({ ...validData, confirmPassword: 'different123' });
		expect(result.success).toBe(false);
		if (!result.success) {
			const confirmError = result.error.issues.find((i) => i.path.includes('confirmPassword'));
			expect(confirmError).toBeDefined();
			expect(confirmError!.message).toBe('Passwords do not match');
		}
	});

	it('rejects missing confirmPassword', () => {
		const { confirmPassword, ...noConfirm } = validData;
		const result = signupSchema.safeParse(noConfirm);
		expect(result.success).toBe(false);
	});

	it('name shorter than 2 chars is rejected when provided', () => {
		const result = signupSchema.safeParse({ ...validData, name: 'A' });
		expect(result.success).toBe(false);
	});
});
