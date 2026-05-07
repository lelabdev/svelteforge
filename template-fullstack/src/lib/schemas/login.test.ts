import { describe, it, expect } from 'vitest';
import { loginSchema } from '$lib/schemas/login';

describe('loginSchema', () => {
	const validData = {
		email: 'user@example.com',
		password: 'password123'
	};

	it('validates correct data', () => {
		const result = loginSchema.safeParse(validData);
		expect(result.success).toBe(true);
	});

	it('rejects missing email', () => {
		const { email, ...noEmail } = validData;
		const result = loginSchema.safeParse(noEmail);
		expect(result.success).toBe(false);
	});

	it('rejects invalid email', () => {
		const result = loginSchema.safeParse({ ...validData, email: 'bad-email' });
		expect(result.success).toBe(false);
	});

	it('rejects missing password', () => {
		const { password, ...noPass } = validData;
		const result = loginSchema.safeParse(noPass);
		expect(result.success).toBe(false);
	});

	it('rejects short password (< 8 chars)', () => {
		const result = loginSchema.safeParse({ ...validData, password: 'short' });
		expect(result.success).toBe(false);
	});

	it('rejects empty object', () => {
		const result = loginSchema.safeParse({});
		expect(result.success).toBe(false);
	});
});
