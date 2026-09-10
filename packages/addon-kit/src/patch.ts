/**
 * Named patch markers (#331).
 *
 * Addon file patches (schema barrels, config injections, hooks) used to guard
 * idempotence with loose `content.includes('keyword')` checks. A consumer
 * comment merely containing the keyword (a TODO mentioning "jobs") made the
 * patch silently skip — a false negative with no diagnostic.
 *
 * Every SVForge patch now carries a NAMED MARKER it can look for: import the
 * helpers from this module, inject `// ${svforgePatchMarker('x-schema')}` on
 * the lines the patch adds, and guard with `hasPatchApplied(content, id,
 * legacyPatterns)`.
 *
 * `legacyPatterns` keep installs made BEFORE the marker convention idempotent
 * (their files contain the old, precise pattern but no marker).
 */

/** The exact marker string injected alongside an SVForge patch. */
export function svforgePatchMarker(patchId: string): string {
	return `svforge:patch:${patchId}`;
}

/**
 * Idempotence guard for a patch.
 *
 * - no content → `true` (nothing to patch; mirrors the previous `!content`
 *   early-returns);
 * - content already carries this patch's marker → `true`;
 * - content matches a legacy pattern (pre-marker installs) → `true`;
 * - otherwise → `false`: the patch must run.
 */
export function hasPatchApplied(
	content: string | undefined,
	patchId: string,
	legacyPatterns: readonly string[] = []
): boolean {
	if (!content) return true;
	if (content.includes(svforgePatchMarker(patchId))) return true;
	return legacyPatterns.some((pattern) => content.includes(pattern));
}
