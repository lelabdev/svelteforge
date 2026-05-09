/**
 * Shared formatting utilities
 */

/**
 * Format a date in short format
 * Example: "Jan 25, 2026"
 */
export function formatDateShort(date: Date): string {
	return new Date(date).toLocaleDateString(undefined, {
		day: 'numeric',
		month: 'short',
		year: 'numeric'
	});
}

/**
 * Format a date with time
 * Example: "Jan 25, 2026, 14:30"
 * Returns '-' for null/undefined dates.
 */
export function formatDateTime(date: Date | null | undefined): string {
	if (!date) return '-';
	return new Date(date).toLocaleDateString(undefined, {
		day: 'numeric',
		month: 'short',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	});
}

/**
 * Format a user's display name from first and last name parts.
 * Returns "First Last" or null if both parts are empty.
 */
export function formatUserName(
	firstName: string | null | undefined,
	lastName: string | null | undefined
): string | null {
	return [firstName, lastName].filter(Boolean).join(' ') || null;
}
