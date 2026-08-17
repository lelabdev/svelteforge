/**
 * Audit pagination parsing (#297).
 *
 * Pure helper (no $lib imports) so it is unit-testable from the repo root:
 * `limit` is clamped to the explicit 1..100 range (default 50) and `offset`
 * to >= 0 (default 0). A negative limit must never reach the query layer
 * (LIMIT -10 is invalid SQL); non-numeric or out-of-range values fall back.
 */
export function parsePagination(
	searchParams: URLSearchParams
): { limit: number; offset: number } {
	const rawLimit = searchParams.get('limit');
	const parsedLimit = rawLimit === null || rawLimit === '' ? NaN : Number(rawLimit);
	// Clamp to the explicit 1..100 range: negative/zero values are clamped up
	// to 1, over-max values are clamped down to 100, missing/non-numeric
	// values fall back to the 50 default. A negative LIMIT can never reach
	// the query layer.
	const limit = Number.isNaN(parsedLimit) ? 50 : Math.min(100, Math.max(1, Math.trunc(parsedLimit)));
	const rawOffset = searchParams.get('offset');
	const parsedOffset = rawOffset === null || rawOffset === '' ? NaN : Number(rawOffset);
	const offset = Number.isNaN(parsedOffset) ? 0 : Math.max(0, Math.trunc(parsedOffset));
	return { limit, offset };
}
