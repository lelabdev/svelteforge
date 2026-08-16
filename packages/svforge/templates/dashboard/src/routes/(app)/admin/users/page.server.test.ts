import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the server modules
vi.mock('$lib/server/db', () => {
	const mockQuery = {
		select: vi.fn(() => mockQuery),
		from: vi.fn(() => mockQuery),
		where: vi.fn(() => mockQuery),
		limit: vi.fn(() => []),
		orderBy: vi.fn(() => []),
		insert: vi.fn(() => ({ values: vi.fn() })),
		update: vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn() })) })),
		delete: vi.fn(() => ({ where: vi.fn() })),
		transaction: vi.fn(async (cb: Function) => cb({
			delete: vi.fn(() => ({ where: vi.fn() }))
		}))
	};
	return { db: mockQuery };
});

vi.mock('$lib/server/db/schema', () => ({
	user: { id: 'id', email: 'email', name: 'name' },
	account: { userId: 'userId' },
	session: { userId: 'userId' }
}));

vi.mock('$lib/server/admin', () => ({
	isAdmin: vi.fn()
}));

vi.mock('better-auth/crypto', () => ({
	hashPassword: vi.fn(() => 'hashed-pw')
}));

vi.mock('drizzle-orm', () => ({
	desc: vi.fn(),
	eq: vi.fn()
}));

/**
 * Tests for the admin users page server — authorization, validation,
 * and user management actions.
 */
describe('admin users +page.server — authorization', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('rejects non-admin users with 403', async () => {
		const { isAdmin } = await import('$lib/server/admin');
		vi.mocked(isAdmin).mockResolvedValue(false);

		const mod = await import('./+page.server');
		await expect(
			mod.actions.create({
				locals: { user: { id: 'nonadmin' } },
				request: new Request('http://test', { method: 'POST' })
			} as any)
		).rejects.toThrow();
	});

	it('rejects anonymous users with 401', async () => {
		const mod = await import('./+page.server');
		await expect(
			mod.actions.update({
				locals: { user: null },
				request: new Request('http://test', { method: 'POST' })
			} as any)
		).rejects.toThrow();
	});
});

describe('admin users +page.server — validation', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('returns 400 for missing fields on create', async () => {
		const { isAdmin } = await import('$lib/server/admin');
		vi.mocked(isAdmin).mockResolvedValue(true);

		const mod = await import('./+page.server');
		const formData = new FormData();
		// Missing name and password
		formData.set('email', 'test@test.com');

		const result = await mod.actions.create({
			locals: { user: { id: 'admin1' } },
			request: { formData: async () => formData }
		} as any);

		expect((result as { status: number }).status).toBe(400);
	});
});

describe('admin users +page.server — user management', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('allows admin to toggle verification (success)', async () => {
		const { isAdmin } = await import('$lib/server/admin');
		vi.mocked(isAdmin).mockResolvedValue(true);

		const { db } = await import('$lib/server/db');
		// Mock that user exists
		(db.select as any).mockReturnValueOnce({
			from: vi.fn(() => ({
				where: vi.fn(() => ({ limit: vi.fn(() => []) })),
				orderBy: vi.fn(() => [])
			}))
		});

		const mod = await import('./+page.server');
		const formData = new FormData();
		formData.set('id', 'user-1');
		formData.set('verified', 'false');

		const result = await mod.actions.toggleVerify({
			locals: { user: { id: 'admin1' } },
			request: { formData: async () => formData }
		} as any);

		expect(result).toHaveProperty('success', true);
	});
});
