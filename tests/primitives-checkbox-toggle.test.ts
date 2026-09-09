// @vitest-environment jsdom
/**
 * #321 — Checkbox and Toggle primitives: class placement, form attribute
 * forwarding, and two-way binding.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/svelte';
import '@testing-library/jest-dom/vitest';
import Checkbox from '../packages/svforge/templates/base/src/lib/components/svforge/primitives/Checkbox.svelte';
import Toggle from '../packages/svforge/templates/base/src/lib/components/svforge/primitives/Toggle.svelte';
import ToggleHarness from './fixtures/ToggleHarness.svelte';
import CheckboxHarness from './fixtures/CheckboxHarness.svelte';

afterEach(cleanup);

describe('Checkbox (#321)', () => {
	it('custom class goes on the checkbox control, not the wrapping label', () => {
		const { container } = render(Checkbox, {
			props: { label: 'Agree', class: 'my-custom-class' }
		});
		const label = container.querySelector('label');
		const control = container.querySelector('input[type="checkbox"]');
		expect(label).not.toBeNull();
		expect(control).not.toBeNull();
		expect(label).not.toHaveClass('my-custom-class');
		expect(control).toHaveClass('checkbox');
		expect(control).toHaveClass('my-custom-class');
	});

	it('forwards name/required/disabled/value to the control', () => {
		const { getByLabelText } = render(Checkbox, {
			props: { label: 'Agree', name: 'terms', required: true, disabled: true, value: 'yes' }
		});
		const control = getByLabelText('Agree') as HTMLInputElement;
		expect(control).toHaveAttribute('name', 'terms');
		expect(control).toHaveAttribute('required');
		expect(control).toBeDisabled();
		expect(control).toHaveAttribute('value', 'yes');
	});

	it('two-way binds `checked`', async () => {
		const { getByLabelText, getByTestId } = render(CheckboxHarness);
		const mirror = getByTestId('mirror');
		const control = getByLabelText('Agree') as HTMLInputElement;

		expect(mirror.textContent.trim()).toBe('false');
		fireEvent.click(control);
		// jsdom toggles the DOM on click but svelte's bind listens to `change`.
		await fireEvent.change(control);
		expect(mirror.textContent.trim()).toBe('true');
	});

	it('clicking the visible label text also flips the control (implicit association)', () => {
		const { getByText, getByLabelText } = render(Checkbox, { props: { label: 'Agree' } });
		const control = getByLabelText('Agree') as HTMLInputElement;
		fireEvent.click(getByText('Agree'));
		expect(control).toBeChecked();
	});
});

describe('Toggle — composition over the official Skeleton Switch (#321)', () => {
	it('renders a switch with native form semantics (hidden checkbox input)', () => {
		const { container, getByRole } = render(Toggle, { props: { label: 'Notifications' } });
		// Zag's accessible control is the visually-hidden native input; the
		// decorative track is aria-hidden. Both live inside the switch root.
		const hidden = getByRole('checkbox') as HTMLInputElement;
		expect(hidden.tagName).toBe('INPUT');
		expect(container.querySelector('[data-part="control"]')).toHaveAttribute(
			'aria-hidden',
			'true'
		);
	});

	it('forwards name/required/form to the hidden input', () => {
		const { getByRole } = render(Toggle, {
			props: { name: 'notifications', required: true, form: 'settings-form' }
		});
		const hidden = getByRole('checkbox') as HTMLInputElement;
		expect(hidden).toHaveAttribute('name', 'notifications');
		expect(hidden).toHaveAttribute('required');
		expect(hidden).toHaveAttribute('form', 'settings-form');
	});

	it('disabled switch ignores interaction', async () => {
		const onCheckedChange = vi.fn();
		const { container } = render(Toggle, {
			props: { name: 'notifications', disabled: true, onCheckedChange }
		});
		const control = container.querySelector('[data-part="control"]')!;
		await fireEvent.click(control);
		expect(onCheckedChange).not.toHaveBeenCalled();
		expect(container.querySelector('[data-part="root"]')).toHaveAttribute('data-state', 'unchecked');
	});

	it('two-way binds `checked` through real interaction', async () => {
		const { container, getByTestId } = render(ToggleHarness, { props: { initial: false } });
		const mirror = getByTestId('mirror');
		expect(mirror.textContent.trim()).toBe('false');
		const control = container.querySelector('[data-part="control"]')!;
		await fireEvent.click(control);
		expect(mirror.textContent.trim()).toBe('true');
	});

	it('reports onCheckedChange with the new state', async () => {
		const onCheckedChange = vi.fn();
		const { container } = render(Toggle, { props: { onCheckedChange } });
		const control = container.querySelector('[data-part="control"]')!;
		await fireEvent.click(control);
		expect(onCheckedChange).toHaveBeenCalledWith(expect.objectContaining({ checked: true }));
	});

	it('renders the visible label', () => {
		const { getByText } = render(Toggle, { props: { label: 'Enable notifications' } });
		expect(getByText('Enable notifications')).toBeInTheDocument();
	});

	it('forwards typed DOM handlers to the hidden input', async () => {
		const onchange = vi.fn();
		const onclick = vi.fn();
		const onblur = vi.fn();
		const onfocus = vi.fn();
		const onkeydown = vi.fn();
		const onkeyup = vi.fn();
		const { getByRole } = render(Toggle, {
			props: { onchange, onclick, onblur, onfocus, onkeydown, onkeyup }
		});
		const hidden = getByRole('checkbox') as HTMLInputElement;
		await fireEvent.click(hidden);
		await fireEvent.focus(hidden);
		await fireEvent.blur(hidden);
		await fireEvent.keyDown(hidden, { key: ' ' });
		await fireEvent.keyUp(hidden, { key: ' ' });
		expect(onclick).toHaveBeenCalledTimes(1);
		expect(onfocus).toHaveBeenCalledTimes(1);
		expect(onblur).toHaveBeenCalledTimes(1);
		expect(onkeydown).toHaveBeenCalledTimes(1);
		expect(onkeyup).toHaveBeenCalledTimes(1);
		// A checkbox click activation (or an explicit change) flips the value —
		// the change event must land on the INPUT with the consumer handler.
		await fireEvent.change(hidden, { target: { checked: true } });
		expect(onchange).toHaveBeenCalled();
		const changeEvent = onchange.mock.calls.at(-1)?.[0] as Event;
		expect(changeEvent.target).toBe(hidden);
	});

	it('consumer handlers are composed with the machine, not substituted for it', async () => {
		// Skeleton's mergeProps calls ALL handlers — forwarding a consumer
		// handler must not break the internal checked state (#321).
		const onchange = vi.fn();
		const onCheckedChange = vi.fn();
		const { container } = render(Toggle, { props: { onchange, onCheckedChange } });
		const control = container.querySelector('[data-part="control"]')!;
		await fireEvent.click(control);
		// The machine still drives onCheckedChange…
		expect(onCheckedChange).toHaveBeenCalledWith(expect.objectContaining({ checked: true }));
		// …and the forwarded onchange also observes the DOM change on the input.
		expect(onchange).toHaveBeenCalledTimes(1);
	});
});
