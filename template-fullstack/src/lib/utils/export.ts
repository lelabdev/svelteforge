/**
 * CSV export utility
 */

export interface ExportColumn<T> {
	/** Property key on the data object */
	key: keyof T & string;
	/** Column header label */
	label: string;
	/** Optional transform applied before writing */
	format?: (value: T[keyof T & string], row: T) => string;
}

/**
 * Escape a single CSV cell value.
 * Wraps in double-quotes when the value contains commas, quotes, or newlines.
 */
function escapeCSV(value: string): string {
	if (value.includes('"') || value.includes(',') || value.includes('\n') || value.includes('\r')) {
		return `"${value.replace(/"/g, '""')}"`;
	}
	return value;
}

/**
 * Export an array of objects as a downloadable CSV file.
 *
 * @param data    - Rows to export
 * @param filename - Download filename (without extension)
 * @param columns - Column definitions controlling order, headers, and formatting
 */
export function exportToCSV<T extends Record<string, unknown>>(
	data: T[],
	filename: string,
	columns: ExportColumn<T>[]
): void {
	const header = columns.map((col) => escapeCSV(col.label)).join(',');
	const rows = data.map((row) =>
		columns
			.map((col) => {
				const raw = row[col.key];
				const formatted = col.format ? col.format(raw, row) : String(raw ?? '');
				return escapeCSV(formatted);
			})
			.join(',')
	);

	const csv = [header, ...rows].join('\n');
	const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
	const url = URL.createObjectURL(blob);

	const link = document.createElement('a');
	link.href = url;
	link.download = `${filename}.csv`;
	link.style.display = 'none';
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
}
