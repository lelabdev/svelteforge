/**
 * Badge Component Tests
 *
 * Tests rendering of the Badge UI component including text content,
 * variant classes, and snippet (children) rendering.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import Badge from './Badge.svelte';

/**
 * Helper: create a Svelte 5 snippet that renders the given text.
 */
function textSnippet(text: string) {
	return createRawSnippet(() => ({
		render: () => `<span>${text}</span>`
	}));
}

describe('Badge', () => {
	afterEach(() => cleanup());

	it('renders text content via children snippet', () => {
		const { container } = render(Badge, { children: textSnippet('Hello Badge') });
		expect(container.textContent).toContain('Hello Badge');
	});

	it('renders as a span element', () => {
		const { container } = render(Badge, { children: textSnippet('Test') });
		// The outer span is the badge wrapper
		const badge = container.querySelector('.badge');
		expect(badge).toBeInTheDocument();
		expect(badge?.tagName).toBe('SPAN');
	});

	it('applies badge base class', () => {
		const { container } = render(Badge, { children: textSnippet('Base') });
		const badge = container.querySelector('.badge');
		expect(badge).toBeInTheDocument();
	});

	it('applies default variant (surface) class', () => {
		const { container } = render(Badge, { children: textSnippet('Default') });
		const badge = container.querySelector('.badge');
		expect(badge?.className).toContain('preset-tonal-surface-500');
	});

	it('applies primary variant class', () => {
		const { container } = render(Badge, {
			variant: 'primary',
			children: textSnippet('Primary')
		});
		const badge = container.querySelector('.badge');
		expect(badge?.className).toContain('preset-tonal-primary-500');
	});

	it('applies secondary variant class', () => {
		const { container } = render(Badge, {
			variant: 'secondary',
			children: textSnippet('Secondary')
		});
		const badge = container.querySelector('.badge');
		expect(badge?.className).toContain('preset-tonal-secondary-500');
	});

	it('applies success variant class', () => {
		const { container } = render(Badge, {
			variant: 'success',
			children: textSnippet('Success')
		});
		const badge = container.querySelector('.badge');
		expect(badge?.className).toContain('preset-tonal-success-500');
	});

	it('applies warning variant class', () => {
		const { container } = render(Badge, {
			variant: 'warning',
			children: textSnippet('Warning')
		});
		const badge = container.querySelector('.badge');
		expect(badge?.className).toContain('preset-tonal-warning-500');
	});

	it('applies error variant class', () => {
		const { container } = render(Badge, {
			variant: 'error',
			children: textSnippet('Error')
		});
		const badge = container.querySelector('.badge');
		expect(badge?.className).toContain('preset-tonal-error-500');
	});

	it('applies custom class prop', () => {
		const { container } = render(Badge, {
			class: 'my-custom-class',
			children: textSnippet('Custom')
		});
		const badge = container.querySelector('.badge');
		expect(badge?.className).toContain('my-custom-class');
	});
});
