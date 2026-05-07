/**
 * EmptyState Component Tests
 *
 * Tests rendering of the EmptyState UI component including title,
 * description, icon, and action snippet.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/svelte';
import EmptyState from './EmptyState.svelte';

describe('EmptyState', () => {
	afterEach(() => cleanup());

	it('renders title text', () => {
		render(EmptyState, { title: 'Nothing here' });
		expect(screen.getByText('Nothing here')).toBeInTheDocument();
	});

	it('renders title as an h3 element', () => {
		render(EmptyState, { title: 'Empty' });
		const heading = screen.getByRole('heading', { level: 3 });
		expect(heading).toHaveTextContent('Empty');
	});

	it('renders description text when provided', () => {
		render(EmptyState, {
			title: 'No items',
			description: 'Add some items to get started'
		});
		expect(screen.getByText('Add some items to get started')).toBeInTheDocument();
	});

	it('does not render description element when not provided', () => {
		const { container } = render(EmptyState, { title: 'No items' });
		// No <p> element should exist when description is not provided
		expect(container.querySelector('p')).not.toBeInTheDocument();
	});

	// TODO: Action snippet rendering requires passing a real Svelte 5 Snippet
	// object, which cannot be created as a plain function in tests.
	// Skipped until a helper for creating Snippet objects is available.
	it.skip('renders action snippet when provided', () => {
		// Snippet props require a compiled Svelte 5 snippet, not a plain function
	});

	it('does not render action content when not provided', () => {
		render(EmptyState, { title: 'No data' });
		expect(screen.queryByRole('button')).not.toBeInTheDocument();
	});

	it('renders with default inbox icon container', () => {
		const { container } = render(EmptyState, { title: 'Empty' });
		// Icon renders as an inline-flex div
		const iconDiv = container.querySelector('.inline-flex');
		expect(iconDiv).toBeInTheDocument();
	});

	it('applies flex column layout classes', () => {
		const { container } = render(EmptyState, { title: 'Empty' });
		const wrapper = container.firstElementChild as HTMLElement;
		expect(wrapper.className).toContain('flex');
		expect(wrapper.className).toContain('flex-col');
		expect(wrapper.className).toContain('items-center');
		expect(wrapper.className).toContain('justify-center');
	});
});
