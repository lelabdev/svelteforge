// @vitest-environment jsdom
/**
 * #321 — Input / Textarea / Select primitives: SSR-stable `$props.id()`
 * ids, label association, and error wiring (aria-invalid + aria-describedby).
 */
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/svelte';
import '@testing-library/jest-dom/vitest';
import Input from '../packages/svforge/templates/base/src/lib/components/svforge/primitives/Input.svelte';
import Textarea from '../packages/svforge/templates/base/src/lib/components/svforge/primitives/Textarea.svelte';
import Select from '../packages/svforge/templates/base/src/lib/components/svforge/primitives/Select.svelte';

const options = [
	{ value: '', label: 'Choose…' },
	{ value: 'design', label: 'Design' },
	{ value: 'dev', label: 'Development' }
];

afterEach(cleanup);

describe('Input (#321)', () => {
	it('associates the label with the input without an explicit id', () => {
		const { getByLabelText } = render(Input, { props: { label: 'Email' } });
		const input = getByLabelText('Email');
		expect(input.tagName).toBe('INPUT');
		expect(input.id).not.toBe('');
	});

	it('generates an id so the label always has a `for` target', () => {
		const { getByLabelText } = render(Input, { props: { label: 'Email' } });
		const input = getByLabelText('Email');
		expect(input.id).not.toBe('');
		// Hydration parity of generated ids is covered by primitives-ssr.test.ts.
	});

	it('respects an explicit id for control, label and error', () => {
		const { getByLabelText, getByText } = render(Input, {
			props: { id: 'email-field', label: 'Email', error: 'Required', type: 'email' }
		});
		const input = getByLabelText('Email');
		expect(input).toHaveAttribute('id', 'email-field');
		expect(input).toHaveAttribute('type', 'email');
		const error = getByText('Required');
		expect(error).toHaveAttribute('id', 'email-field-error');
	});

	it('wires error state: aria-invalid + aria-describedby -> error element', () => {
		const { getByLabelText, getByText } = render(Input, {
			props: { label: 'Email', error: 'Invalid email' }
		});
		const input = getByLabelText('Email');
		expect(input).toHaveAttribute('aria-invalid', 'true');
		const errorId = getByText('Invalid email').id;
		expect(input.getAttribute('aria-describedby')).toBe(errorId);
	});

	it('merges a consumer-provided aria-describedby with the error id', () => {
		const { getByLabelText, getByText } = render(Input, {
			props: {
				label: 'Email',
				error: 'Invalid email',
				'aria-describedby': 'hint-1'
			}
		});
		const describedBy = getByLabelText('Email').getAttribute('aria-describedby');
		expect(describedBy).toBe(`hint-1 ${getByText('Invalid email').id}`);
	});

	it('clean state: no aria-invalid, no error element', () => {
		const { getByLabelText, queryByText } = render(Input, { props: { label: 'Email' } });
		const input = getByLabelText('Email');
		expect(input).not.toHaveAttribute('aria-invalid');
		expect(input).not.toHaveAttribute('aria-describedby');
		expect(queryByText(/required/i)).toBeNull();
	});

	it('forwards name/required/placeholder attributes', () => {
		const { getByLabelText } = render(Input, {
			props: { label: 'Email', name: 'email', required: true, placeholder: 'you@example.com' }
		});
		const input = getByLabelText('Email');
		expect(input).toHaveAttribute('name', 'email');
		expect(input).toHaveAttribute('required');
		expect(input).toHaveAttribute('placeholder', 'you@example.com');
	});
});

describe('Textarea (#321)', () => {
	it('associates the label with the textarea', () => {
		const { getByLabelText } = render(Textarea, { props: { label: 'Message' } });
		const textarea = getByLabelText('Message');
		expect(textarea.tagName).toBe('TEXTAREA');
		expect(textarea.id).not.toBe('');
	});

	it('wires error state through aria-invalid + aria-describedby', () => {
		const { getByLabelText, getByText } = render(Textarea, {
			props: { label: 'Message', error: 'Too short' }
		});
		const textarea = getByLabelText('Message');
		expect(textarea).toHaveAttribute('aria-invalid', 'true');
		expect(textarea.getAttribute('aria-describedby')).toBe(getByText('Too short').id);
	});
});

describe('Select (#321)', () => {
	it('label `for` always targets a real id — even without an explicit one', () => {
		const { getByLabelText } = render(Select, { props: { label: 'Category', options } });
		const select = getByLabelText('Category');
		expect(select.tagName).toBe('SELECT');
		expect(select.id).not.toBe('');
	});

	it('explicit id wins and the label targets it', () => {
		const { getByLabelText } = render(Select, {
			props: { id: 'category-field', label: 'Category', options }
		});
		expect(getByLabelText('Category')).toHaveAttribute('id', 'category-field');
	});

	it('renders keyed options', () => {
		const { getByRole } = render(Select, { props: { label: 'Category', options } });
		const select = getByRole('combobox') as HTMLSelectElement;
		expect(select.options).toHaveLength(3);
		expect(select.options[1]).toHaveAttribute('value', 'design');
	});

	it('wires error state through aria-invalid + aria-describedby', () => {
		const { getByLabelText, getByText } = render(Select, {
			props: { label: 'Category', options, error: 'Pick one' }
		});
		const select = getByLabelText('Category');
		expect(select).toHaveAttribute('aria-invalid', 'true');
		expect(select.getAttribute('aria-describedby')).toBe(getByText('Pick one').id);
	});
});
