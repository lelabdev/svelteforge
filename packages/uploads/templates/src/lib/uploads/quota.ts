/**
 * Per-user upload quota (#332).
 *
 * The S3 POST policy enforces the size of ONE multipart request at storage
 * level. A per-user TOTAL, or a stricter per-upload cap, is application
 * policy — this module is the single gate the endpoint consults, and the
 * place an application replaces the default with its own accounting (usage
 * table, S3 bucket listing, billing hooks…).
 *
 * Pure module on purpose: no framework imports, so the policy is
 * unit-testable and reusable outside the endpoint.
 */

/** Environment variable holding the per-user, per-upload cap in bytes. */
export const USER_QUOTA_ENV_VAR = 'S3_USER_QUOTA_BYTES';

/**
 * Parse the per-upload quota (bytes) from an env value.
 * Absent, empty, non-numeric, fractional, negative or zero → `null`
 * (no quota). Zero is treated as unset: a silent "user may upload nothing"
 * must be an explicit endpoint decision, never an env typo.
 */
export function parseUserQuotaBytes(value: string | undefined): number | null {
	if (value === undefined) return null;
	const trimmed = value.trim();
	if (trimmed === '') return null;
	const parsed = Number(trimmed);
	if (!Number.isSafeInteger(parsed) || parsed <= 0) return null;
	return parsed;
}

/**
 * The 413 message when a declared upload size exceeds the per-user quota,
 * or `null` when the upload is within quota (at-limit allowed).
 */
export function quotaExceededMessage(quotaBytes: number, declaredBytes: number): string | null {
	if (declaredBytes <= quotaBytes) return null;
	return `File exceeds your upload quota of ${quotaBytes} bytes`;
}
