/**
 * Toast state management
 *
 * Usage:
 * ```svelte
 * <script>
 *   import { addToast, removeToast } from '$lib/components/ui/toast-state.svelte';
 *   import Toast from '$lib/components/ui/Toast.svelte';
 * </script>
 *
 * <Toast />
 *
 * <button onclick={() => addToast({ title: 'Saved!' })}>Save</button>
 * ```
 */

interface ToastItem {
	id: string;
	kind: 'info' | 'success' | 'warning' | 'error';
	title: string;
	description?: string;
	timeout?: number;
}

let toasts = $state<ToastItem[]>([]);

export function getToasts(): ToastItem[] {
	return toasts;
}

export function addToast(opts: {
	kind?: 'info' | 'success' | 'warning' | 'error';
	title: string;
	description?: string;
	timeout?: number;
}): string {
	const id = crypto.randomUUID();
	const entry: ToastItem = {
		id,
		kind: opts.kind ?? 'info',
		title: opts.title,
		description: opts.description,
		timeout: opts.timeout ?? 5000
	};
	toasts = [...toasts, entry];

	if (entry.timeout && entry.timeout > 0) {
		setTimeout(() => removeToast(id), entry.timeout);
	}

	return id;
}

export function removeToast(id: string): void {
	toasts = toasts.filter((t) => t.id !== id);
}
