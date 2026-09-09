/**
 * Audit PII classification & redaction (#332).
 *
 * The audit trail is a business log: some fields are inherently
 * personal data, and free-form metadata is where PII leaks in practice.
 * This module formalizes the classification and the ONE redaction
 * implementation used by `audit.record()` when `AUDIT_PII_MODE=redact`.
 *
 * Classification (documented contract):
 *   - `ipAddress` and `userAgent` are personal data under GDPR — collect
 *     them only when the feature genuinely needs them;
 *   - metadata keys matching the patterns below are treated as PII.
 *
 * Pure module on purpose: no framework imports, so the policy is
 * unit-testable.
 */

export const PII_MODE_ENV_VAR = 'AUDIT_PII_MODE';

export type PiiMode = 'keep' | 'redact';

/** Audit columns classified as PII (GDPR personal data). */
export const PII_FIELDS = ['ipAddress', 'userAgent'] as const;

/**
 * Metadata KEY patterns classified as PII. Matched case-insensitively
 * against the top-level keys of the metadata object.
 */
export const PII_METADATA_PATTERNS: RegExp[] = [
	/e-?mail/i,
	/phone/i,
	/\bfirst_?name\b|\blast_?name\b|\bfull_?name\b/i,
	/address/i, // postal address; IP addresses live in the dedicated column
	/\bssn\b|social.?security/i,
	/\bbirth\b|\bdob\b/i,
	/token|secret|password/i,
	/\biban\b|\bcard\b/i
];

/** True when a metadata key is classified as PII. */
export function isPiiKey(key: string): boolean {
	return PII_METADATA_PATTERNS.some((pattern) => pattern.test(key));
}

/**
 * Strip PII keys from a metadata object. Shallow by design — top-level keys
 * are the audit contract; deeply nested structures should not be in the
 * trail at all. NEVER mutates the input. Returns the clean copy and the
 * list of removed keys (for the audit of the audit).
 */
export function redactMetadata(metadata: Record<string, unknown>): {
	clean: Record<string, unknown>;
	redactedKeys: string[];
} {
	const clean: Record<string, unknown> = {};
	const redactedKeys: string[] = [];
	for (const [key, value] of Object.entries(metadata)) {
		if (isPiiKey(key)) {
			redactedKeys.push(key);
			continue;
		}
		clean[key] = value;
	}
	return { clean, redactedKeys };
}

/**
 * Resolve AUDIT_PII_MODE. Default `keep` (collect as provided); `redact`
 * (case-insensitive) makes `audit.record()` strip PII metadata keys and
 * null out the PII columns before insert.
 */
export function resolvePiiMode(value: string | undefined): PiiMode {
	return typeof value === 'string' && value.trim().toLowerCase() === 'redact' ? 'redact' : 'keep';
}
