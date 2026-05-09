/**
 * Admin Users Page Server Tests
 *
 * Tests that the load function returns the mock users array with correct shape.
 */
import { describe, it, expect } from 'vitest';

const mod = await import('./+page.server');

describe('admin/users +page.server.ts', () => {
	it('returns a users array', async () => {
		const result = await mod.load();
		expect(Array.isArray(result.users)).toBe(true);
	});

	it('returns the expected number of users (15)', async () => {
		const result = await mod.load();
		expect(result.users).toHaveLength(15);
	});

	it('each user has the correct shape (id, name, email, role, createdAt)', async () => {
		const result = await mod.load();

		for (const user of result.users) {
			expect(user).toHaveProperty('id');
			expect(user).toHaveProperty('name');
			expect(user).toHaveProperty('email');
			expect(user).toHaveProperty('role');
			expect(user).toHaveProperty('createdAt');

			expect(typeof user.id).toBe('string');
			expect(typeof user.name).toBe('string');
			expect(typeof user.email).toBe('string');
			expect(['admin', 'user']).toContain(user.role);
			expect(typeof user.createdAt).toBe('string');
		}
	});

	it('contains expected admin users', async () => {
		const result = await mod.load();
		const admins = result.users.filter((u) => u.role === 'admin');

		expect(admins.length).toBeGreaterThan(0);
		expect(admins.every((u) => u.role === 'admin')).toBe(true);
		expect(admins.map((u) => u.name)).toContain('Alice Johnson');
	});

	it('contains expected regular users', async () => {
		const result = await mod.load();
		const regularUsers = result.users.filter((u) => u.role === 'user');

		expect(regularUsers.length).toBeGreaterThan(0);
		expect(regularUsers.map((u) => u.name)).toContain('Bob Smith');
	});

	it('ids are unique', async () => {
		const result = await mod.load();
		const ids = result.users.map((u) => u.id);
		const uniqueIds = new Set(ids);

		expect(uniqueIds.size).toBe(ids.length);
	});
});
