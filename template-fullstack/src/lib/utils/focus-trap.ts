/**
 * Svelte action: traps focus inside a modal/dialog element.
 * Moves focus to the first focusable element on mount.
 * Wraps Tab/Shift+Tab to prevent focus leaving the container.
 */

const FOCUSABLE_SELECTORS = [
	'a[href]',
	'button:not([disabled])',
	'input:not([disabled])',
	'select:not([disabled])',
	'textarea:not([disabled])',
	'[tabindex]:not([tabindex="-1"])'
].join(', ');

function getFocusableElements(container: HTMLElement): HTMLElement[] {
	return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS)).filter(
		(el) => el.offsetParent !== null // exclude hidden elements
	);
}

export function focusTrap(node: HTMLElement) {
	// Focus the first focusable element when the modal opens
	const firstFocusable = getFocusableElements(node)[0];
	firstFocusable?.focus();

	function handleKeydown(e: KeyboardEvent) {
		if (e.key !== 'Tab') return;

		const focusable = getFocusableElements(node);
		if (!focusable.length) return;

		const first = focusable[0];
		const last = focusable[focusable.length - 1];

		if (e.shiftKey) {
			if (document.activeElement === first) {
				e.preventDefault();
				last.focus();
			}
		} else {
			if (document.activeElement === last) {
				e.preventDefault();
				first.focus();
			}
		}
	}

	node.addEventListener('keydown', handleKeydown);

	return {
		destroy() {
			node.removeEventListener('keydown', handleKeydown);
		}
	};
}
