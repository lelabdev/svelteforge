import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();

/**
 * Freshness guard for the llms-*.txt dumps (#198).
 *
 * The dumps in packages/svforge/docs/ are the offline reference for agents.
 * They previously sat on Skeleton v4 for months after v5 shipped, silently
 * teaching obsolete conventions (cf. #194, #195). These tests fail when a
 * dump goes missing, loses its fetch header, drifts to a wrong major
 * version, or becomes stale.
 *
 * Regenerate with: bash packages/svforge/scripts/fetch-llms-docs.sh
 */
const MAX_AGE_DAYS = 190;

const dumps = [
	{
		file: 'llms-skeleton.txt',
		// Skeleton v5 markers — the v4 dump contained neither
		markers: ['preset-tonal', '--typo-base--font-family'],
		staleMarkers: ['variant-filled-', 'variant-tonal-']
	},
	{
		file: 'llms-svelte.txt',
		// Svelte 5 + SvelteKit markers
		markers: ['$state', 'SvelteKit', 'runes'],
		staleMarkers: [] as string[]
	}
] as const;

function headerValue(source: string, key: string): string | null {
	const match = source.match(new RegExp(`^${key}: (.+)$`, 'm'));
	return match?.[1]?.trim() ?? null;
}

describe('llms docs dumps freshness (#198)', () => {
	for (const { file, markers, staleMarkers } of dumps) {
		const path = join(ROOT, 'packages/svforge/docs', file);
		const source = existsSync(path) ? readFileSync(path, 'utf-8') : '';

		it(`${file} exists and is not empty`, () => {
			expect(existsSync(path)).toBe(true);
			expect(source.length).toBeGreaterThan(10_000);
		});

		it(`${file} has a fetch header (source + fetched date)`, () => {
			expect(headerValue(source, 'source')).toContain('llms-full.txt');
			expect(headerValue(source, 'fetched')).toMatch(/^\d{4}-\d{2}-\d{2}$/);
		});

		it(`${file} was fetched less than ${MAX_AGE_DAYS} days ago`, () => {
			const fetched = headerValue(source, 'fetched')!;
			const ageDays = (Date.now() - new Date(`${fetched}T00:00:00Z`).getTime()) / 86_400_000;
			expect(
				ageDays,
				`${file} was fetched on ${fetched} (${Math.floor(ageDays)} days ago). ` +
					'Regenerate with: bash packages/svforge/scripts/fetch-llms-docs.sh'
			).toBeLessThan(MAX_AGE_DAYS);
		});

		for (const marker of markers) {
			it(`${file} contains current-major marker "${marker}"`, () => {
				expect(source).toContain(marker);
			});
		}

		for (const stale of staleMarkers) {
			it(`${file} no longer contains stale marker "${stale}"`, () => {
				expect(source).not.toContain(stale);
			});
		}
	}
});
