/**
 * DataTable Component Tests
 *
 * Tests rendering of the DataTable UI component including headers,
 * data rows, empty state message, loading, and sorting.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/svelte';
import DataTable from './DataTable.svelte';

const columns = [
	{ key: 'name', label: 'Name' },
	{ key: 'email', label: 'Email' },
	{ key: 'role', label: 'Role' }
];

const data = [
	{ id: '1', name: 'Alice', email: 'alice@example.com', role: 'Admin' },
	{ id: '2', name: 'Bob', email: 'bob@example.com', role: 'User' },
	{ id: '3', name: 'Charlie', email: 'charlie@example.com', role: 'Editor' }
];

describe('DataTable', () => {
	afterEach(() => cleanup());

	it('renders table with headers', () => {
		render(DataTable, { columns, data: [] });
		expect(screen.getByText('Name')).toBeInTheDocument();
		expect(screen.getByText('Email')).toBeInTheDocument();
		expect(screen.getByText('Role')).toBeInTheDocument();
	});

	it('renders headers inside th elements', () => {
		const { container } = render(DataTable, { columns, data: [] });
		const thElements = container.querySelectorAll('th');
		expect(thElements).toHaveLength(3);
		expect(thElements[0].textContent).toContain('Name');
		expect(thElements[1].textContent).toContain('Email');
		expect(thElements[2].textContent).toContain('Role');
	});

	it('renders rows with data', () => {
		render(DataTable, { columns, data });
		expect(screen.getByText('Alice')).toBeInTheDocument();
		expect(screen.getByText('bob@example.com')).toBeInTheDocument();
		expect(screen.getByText('Editor')).toBeInTheDocument();
	});

	it('renders correct number of data rows', () => {
		const { container } = render(DataTable, { columns, data });
		const tbody = container.querySelector('tbody');
		const rows = tbody?.querySelectorAll('tr');
		expect(rows).toHaveLength(3);
	});

	it('shows empty state message when no data', () => {
		render(DataTable, { columns, data: [] });
		expect(screen.getByText('No data found')).toBeInTheDocument();
	});

	it('shows custom empty message when provided', () => {
		render(DataTable, {
			columns,
			data: [],
			emptyMessage: 'No users available'
		});
		expect(screen.getByText('No users available')).toBeInTheDocument();
	});

	it('empty state row spans all columns', () => {
		const { container } = render(DataTable, { columns, data: [] });
		const td = container.querySelector('td[colspan]');
		expect(td).toBeInTheDocument();
		expect(td?.getAttribute('colspan')).toBe('3');
	});

	it('renders cell values from data', () => {
		const { container } = render(DataTable, { columns, data });
		const cells = container.querySelectorAll('tbody td');
		// 3 rows × 3 columns = 9 cells
		expect(cells).toHaveLength(9);
		// First row cells
		expect(cells[0].textContent).toBe('Alice');
		expect(cells[1].textContent).toBe('alice@example.com');
		expect(cells[2].textContent).toBe('Admin');
	});

	it('renders a table element', () => {
		const { container } = render(DataTable, { columns, data });
		expect(container.querySelector('table')).toBeInTheDocument();
	});

	it('renders loading skeleton rows when loading is true', () => {
		const { container } = render(DataTable, {
			columns,
			data: [],
			loading: true
		});
		// Loading state renders skeleton rows with animate-pulse
		const skeletonRows = container.querySelectorAll('.animate-pulse');
		expect(skeletonRows.length).toBeGreaterThan(0);
	});

	it('sortable column renders as a button', () => {
		const sortableColumns = [
			{ key: 'name', label: 'Name', sortable: true },
			{ key: 'email', label: 'Email' }
		];
		render(DataTable, { columns: sortableColumns, data: [] });
		const buttons = screen.getAllByRole('button');
		// At least the sortable header button
		expect(buttons.length).toBeGreaterThanOrEqual(1);
		expect(buttons[0].textContent).toContain('Name');
	});

	it('clicking sortable column toggles sort direction', async () => {
		const sortableColumns = [
			{ key: 'name', label: 'Name', sortable: true },
			{ key: 'email', label: 'Email' }
		];
		render(DataTable, {
			columns: sortableColumns,
			data
		});

		const sortButton = screen.getByRole('button', { name: /name/i });
		await fireEvent.click(sortButton);
		// After first click: ascending sort indicator
		expect(sortButton.textContent).toContain('↑');

		await fireEvent.click(sortButton);
		// After second click: descending sort indicator
		expect(sortButton.textContent).toContain('↓');
	});
});
