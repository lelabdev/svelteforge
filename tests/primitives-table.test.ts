// @vitest-environment jsdom
/**
 * #321 — Table primitive: generic rows, caption, scoped headers, empty
 * state, REQUIRED row keys for object rows (never array indices), and the
 * structured (table-level) attribute contract.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/svelte';
import '@testing-library/jest-dom/vitest';
import { createRawSnippet } from 'svelte';
import Table from '../packages/svforge/templates/base/src/lib/components/svforge/ui/Table.svelte';
import TableTypedHarness from './fixtures/TableTypedHarness.svelte';

interface UserRow {
	id: string;
	name: string;
	role: string;
}

const columns = [
	{ key: 'name', label: 'Name' },
	{ key: 'role', label: 'Role' }
];

const rows: UserRow[] = [
	{ id: 'u1', name: 'Alice', role: 'Developer' },
	{ id: 'u2', name: 'Bob', role: 'Designer' }
];

const renderTable = (props: Record<string, unknown>) => render(Table, { props });

let warnSpy: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
	warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => {
	warnSpy.mockRestore();
	cleanup();
});

describe('Table — structured contract (#321)', () => {
	it('renders scoped header cells', () => {
		const { getAllByRole } = renderTable({ columns, rows, rowKey: 'id' });
		const headers = getAllByRole('columnheader');
		expect(headers).toHaveLength(2);
		for (const th of headers) {
			expect(th).toHaveAttribute('scope', 'col');
		}
	});

	it('renders plain cell values without a renderer', () => {
		const { getByRole } = renderTable({ columns, rows, rowKey: 'id' });
		const table = getByRole('table');
		expect(table.textContent).toContain('Alice');
		expect(table.textContent).toContain('Designer');
	});

	it('rowKey accepts a field name: rows key on that field', () => {
		const { getByRole } = renderTable({ columns, rows, rowKey: 'id' });
		expect(getByRole('table').querySelectorAll('tbody tr')).toHaveLength(2);
	});

	it('forwards attributes to the <table> element, not the wrapper div', () => {
		const { getByRole } = renderTable({
			columns,
			rows,
			rowKey: 'id',
			id: 'users-table',
			'aria-label': 'Users'
		});
		const table = getByRole('table', { name: 'Users' });
		expect(table).toHaveAttribute('id', 'users-table');
		// The wrapper is a plain scroll container — no consumer API on it.
		expect(table.parentElement).not.toHaveAttribute('id');
		expect(table.parentElement).not.toHaveAttribute('aria-label');
	});

	it('renders a caption from the prop', () => {
		const { getByRole } = renderTable({ columns, rows, rowKey: 'id', caption: 'Team members' });
		expect(getByRole('table').querySelector('caption')).toHaveTextContent('Team members');
	});

	it('renders a caption from a snippet for rich content', () => {
		const caption = createRawSnippet(() => ({
			render: () => '<em>Rich caption</em>'
		}));
		const { getByRole } = renderTable({ columns, rows, rowKey: 'id', caption });
		expect(getByRole('table').querySelector('caption')).toContainHTML('<em>Rich caption</em>');
	});

	it('passes typed rows to the children snippet (generic row)', () => {
		// Compiled snippet in a harness — the row context arrives typed as UserRow
		// because `rows` drives the Table's `Row` generic.
		const { getAllByTestId } = render(TableTypedHarness, { props: { columns, rows } });
		const cells = getAllByTestId('typed-cell');
		expect(cells.map((cell) => cell.textContent)).toEqual([
			'u1:name',
			'u1:role',
			'u2:name',
			'u2:role'
		]);
	});

	it('renders the empty state snippet when rows are empty', () => {
		const empty = createRawSnippet(() => ({ render: () => 'No rows available' }));
		const { getByRole, queryByText } = renderTable({ columns, rows: [], rowKey: 'id', empty });
		expect(queryByText('Alice')).toBeNull();
		const cell = getByRole('table').querySelector('tbody td');
		expect(cell).not.toBeNull();
		expect(cell).toHaveAttribute('colspan', '2');
		expect(cell?.textContent).toContain('No rows available');
	});

	it('renders no empty-state markup while rows exist', () => {
		const empty = createRawSnippet(() => ({ render: () => 'No rows available' }));
		const { getByRole, queryByText } = renderTable({ columns, rows, rowKey: 'id', empty });
		expect(queryByText('No rows available')).toBeNull();
		expect(getByRole('table').querySelectorAll('tbody tr')).toHaveLength(2);
	});

	it('keeps row identity stable across reorder when rowKey is provided', () => {
		const { getByRole, rerender } = renderTable({ columns, rows, rowKey: (r: UserRow) => r.id });
		const firstRowBefore = getByRole('table').querySelectorAll('tbody tr')[0];
		expect(firstRowBefore.textContent).toContain('Alice');

		// Reorder the same row objects — keyed reconciliation moves, not recreates.
		rerender({ columns, rows: [rows[1]!, rows[0]!], rowKey: (r: UserRow) => r.id });
		const firstRowAfter = getByRole('table').querySelectorAll('tbody tr')[0];
		// Keyed on id: row u1 keeps its element even though it moved to second
		// position… it now IS the second row.
		const secondRowAfter = getByRole('table').querySelectorAll('tbody tr')[1];
		expect(firstRowAfter.textContent).toContain('Bob');
		expect(secondRowAfter.textContent).toContain('Alice');
		expect(secondRowAfter).toBe(firstRowBefore);
	});

	it('warns in dev when object rows omit rowKey — no silent index fallback', () => {
		const { getByRole } = renderTable({ columns, rows });
		expect(warnSpy).toHaveBeenCalledTimes(1);
		expect(warnSpy.mock.calls[0]?.[0]).toMatch(/rowKey/);
		// Still renders (graceful degradation), but the contract violation is loud.
		expect(getByRole('table').querySelectorAll('tbody tr')).toHaveLength(2);
	});

	it('primitive rows need no rowKey and never warn', () => {
		const { getByRole } = renderTable({ columns: [{ key: 'name', label: 'Name' }], rows: ['a', 'b'] });
		expect(warnSpy).not.toHaveBeenCalled();
		// Each primitive row keys on its own value.
		expect(getByRole('table').querySelectorAll('tbody tr')).toHaveLength(2);
	});

	it('empty object rows do not trigger the rowKey warning', () => {
		renderTable({ columns, rows: [] });
		expect(warnSpy).not.toHaveBeenCalled();
	});

	it('warns reactively when empty rows are LATER populated with object rows (#321)', () => {
		// The init-only check missed this state — rows start empty (fetch
		// pending) then fill with objects lacking rowKey.
		const { rerender } = renderTable({ columns, rows: [] });
		expect(warnSpy).not.toHaveBeenCalled();
		rerender({ columns, rows });
		expect(warnSpy).toHaveBeenCalledTimes(1);
		expect(warnSpy.mock.calls[0]?.[0]).toMatch(/rowKey/);
	});

	it('stays quiet while the invalid object-row state persists', () => {
		const { rerender } = renderTable({ columns, rows });
		expect(warnSpy).toHaveBeenCalledTimes(1);
		// More invalid rows arrive — same episode, warned once.
		rerender({ columns, rows: [...rows, { id: 'u3', name: 'Cara', role: 'PM' }] });
		expect(warnSpy).toHaveBeenCalledTimes(1);
	});

	it('re-arms after a correction: warns again if the state breaks once more', () => {
		const { rerender } = renderTable({ columns, rows });
		expect(warnSpy).toHaveBeenCalledTimes(1);
		rerender({ columns, rows, rowKey: 'id' });
		expect(warnSpy).toHaveBeenCalledTimes(1);
		// rowKey removed again (explicit reset — rerender merges partially).
		rerender({ columns, rows, rowKey: undefined });
		expect(warnSpy).toHaveBeenCalledTimes(2);
	});
});
