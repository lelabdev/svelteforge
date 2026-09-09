/**
 * Audit retention policy (#332).
 *
 * The audit table is append-only at the application level; the ONLY
 * sanctioned delete path is `audit.purgeExpired()` driven by THIS policy.
 * Default: keep forever — retention becomes real the moment the application
 * sets `AUDIT_RETENTION_DAYS` (or passes an explicit `days` argument).
 *
 * Pure module on purpose: no framework imports, so the policy is
 * unit-testable.
 */

export const RETENTION_ENV_VAR = 'AUDIT_RETENTION_DAYS';

/**
 * Parse the retention period in days from an env value.
 * Absent/empty/invalid/zero/negative → `null` (keep forever). Zero is
 * treated as unset: "purge everything" must be an explicit operator action,
 * never the result of an env typo.
 */
export function parseRetentionDays(value: string | undefined | null): number | null {
	if (value === undefined || value === null) return null;
	const trimmed = value.trim();
	if (trimmed === '') return null;
	const parsed = Number(trimmed);
	if (!Number.isSafeInteger(parsed) || parsed <= 0) return null;
	return parsed;
}

/**
 * The purge boundary (now − retention days), or `null` when no retention is
 * configured (nothing may be purged).
 */
export function retentionCutoff(value: string | undefined | null, now: Date = new Date()): Date | null {
	const days = parseRetentionDays(value);
	if (days === null) return null;
	return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}
