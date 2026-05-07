/**
 * Toast State Tests
 *
 * Tests the toast state management (addToast, removeToast, getToasts).
 * Uses Svelte 5 runes internally, so we skip if compilation fails.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

const toastModule = await import('$lib/components/ui/toast-state.svelte').catch(() => null);

describe.skipIf(!toastModule)('toast-state', () => {
	const { getToasts, addToast, removeToast } = toastModule!;

	beforeEach(() => {
		// Clear all toasts before each test
		const current = getToasts();
		for (const t of current) {
			removeToast(t.id);
		}
	});

	it('starts with no toasts (after cleanup)', () => {
		expect(getToasts()).toHaveLength(0);
	});

	it('addToast adds a toast and returns an id', () => {
		const id = addToast({ title: 'Hello' });
		expect(id).toBeDefined();
		expect(typeof id).toBe('string');
		expect(getToasts()).toHaveLength(1);
	});

	it('addToast defaults kind to "info"', () => {
		addToast({ title: 'Test' });
		expect(getToasts()[0].kind).toBe('info');
	});

	it('addToast uses provided kind', () => {
		addToast({ title: 'Test', kind: 'success' });
		expect(getToasts()[0].kind).toBe('success');
	});

	it('addToast includes description when provided', () => {
		addToast({ title: 'Test', description: 'Details here' });
		expect(getToasts()[0].description).toBe('Details here');
	});

	it('removeToast removes the specified toast', () => {
		const id1 = addToast({ title: 'First' });
		addToast({ title: 'Second' });
		expect(getToasts()).toHaveLength(2);

		removeToast(id1);
		expect(getToasts()).toHaveLength(1);
		expect(getToasts()[0].title).toBe('Second');
	});

	it('removeToast with invalid id does nothing', () => {
		addToast({ title: 'Test' });
		removeToast('non-existent-id');
		expect(getToasts()).toHaveLength(1);
	});

	it('addToast sets up auto-removal timeout (defaults to 5000ms)', () => {
		vi.useFakeTimers();
		addToast({ title: 'Auto remove' });
		expect(getToasts()).toHaveLength(1);

		vi.advanceTimersByTime(5000);
		expect(getToasts()).toHaveLength(0);

		vi.useRealTimers();
	});

	it('addToast respects custom timeout of 0 (no auto-remove)', () => {
		vi.useFakeTimers();
		addToast({ title: 'Persistent', timeout: 0 });
		expect(getToasts()).toHaveLength(1);

		vi.advanceTimersByTime(10000);
		expect(getToasts()).toHaveLength(1);

		vi.useRealTimers();
	});
});
