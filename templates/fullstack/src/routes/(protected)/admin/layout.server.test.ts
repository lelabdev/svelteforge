/**
 * Admin Layout Server Guard Tests
 *
 * Tests that the admin layout load function correctly redirects
 * non-admin users and allows admin users through.
 */
import { describe, it, expect, vi } from 'vitest';

// Mock @sveltejs/kit redirect before importing the module
vi.mock('@sveltejs/kit', () => ({
	redirect: (status: number, location: string) => {
		const err = new Error(`Redirect ${status} → ${location}`);
		(err as any).status = status;
		(err as any).location = location;
		throw err;
	}
}));

// Dynamic import to avoid + prefix issues with module resolution
const loadModule = await import('./+layout.server');

// Helper to build a fake load context
function makeContext(user: any) {
	return {
		parent: vi.fn().mockResolvedValue({ user })
	};
}

describe('admin +layout.server.ts', () => {
	it('redirects to /login when no user', async () => {
		const ctx = makeContext(null);
		await expect(loadModule.load(ctx as any)).rejects.toThrow('Redirect 303 → /login');
	});

	it('redirects to /dashboard when user role is not admin', async () => {
		const ctx = makeContext({ id: '1', name: 'User', role: 'user' });
		await expect(loadModule.load(ctx as any)).rejects.toThrow('Redirect 303 → /dashboard');
	});

	it('allows admin user and returns user data', async () => {
		const adminUser = { id: '1', name: 'Admin', role: 'admin' };
		const ctx = makeContext(adminUser);
		const result = await loadModule.load(ctx as any);
		expect(result).toEqual({ user: adminUser });
	});
});
