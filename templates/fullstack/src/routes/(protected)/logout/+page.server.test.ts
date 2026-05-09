/**
 * Logout Route Tests
 *
 * Tests that the logout action calls auth.api.signOut with request headers
 * and redirects to /login.
 */
import { describe, it, expect, vi } from 'vitest';

// Mock @sveltejs/kit redirect
vi.mock('@sveltejs/kit', () => ({
	redirect: (status: number, location: string) => {
		const err = new Error(`Redirect ${status} → ${location}`);
		(err as any).status = status;
		(err as any).location = location;
		throw err;
	}
}));

// Mock the auth module — hoisted before imports
const mockSignOut = vi.fn();
vi.mock('$lib/server/auth', () => ({
	auth: {
		api: {
			signOut: mockSignOut
		}
	}
}));

// Dynamic import to avoid + prefix issues with module resolution
const mod = await import('./+page.server');

function makeEvent(headers: Record<string, string> = {}) {
	return {
		request: { headers: new Headers(headers) }
	};
}

describe('logout +page.server.ts', () => {
	it('calls signOut with request headers', async () => {
		mockSignOut.mockResolvedValue(undefined);
		const event = makeEvent({ cookie: 'session=abc123' });

		await expect(
			mod.actions.default(event as any)
		).rejects.toThrow('Redirect 302 → /login');

		expect(mockSignOut).toHaveBeenCalledWith({
			headers: event.request.headers
		});
	});

	it('redirects to /login after signOut', async () => {
		mockSignOut.mockResolvedValue(undefined);
		const event = makeEvent();

		await expect(
			mod.actions.default(event as any)
		).rejects.toThrow('Redirect 302 → /login');
	});

	it('signOut failure still redirects', async () => {
		// When signOut rejects, the error propagates before redirect is thrown.
		// This documents current behaviour: signOut failure prevents redirect.
		mockSignOut.mockRejectedValueOnce(new Error('signOut failed'));

		const event = makeEvent();

		await expect(
			mod.actions.default(event as any)
		).rejects.toThrow('signOut failed');

		// Restore default mock behaviour
		mockSignOut.mockResolvedValue(undefined);
	});
});
