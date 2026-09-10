/**
 * Local LLM references delivered to every generated project (#317).
 *
 * SvelteForge already caches fresh Skeleton/Svelte docs for its own
 * tests/tooling (packages/svforge/docs/llms-*.txt, guarded by
 * tests/llms-docs-freshness.test.ts). Generated projects receive the SAME
 * cached files under docs/ so agents search a vendored, version-matched
 * reference BEFORE touching Skeleton UI/theme — instead of fetching remote
 * llms-full.txt or trusting training memory.
 *
 * Single source of truth: the cached dumps themselves. The freshness tests
 * keep the shipped copies from becoming stale silently; nothing here
 * duplicates or transforms their content.
 *
 * The files are read from the PACKAGE's docs/ directory at scaffold time:
 * - from source (tests/dev): src/../docs/
 * - from the built/bundled dist (sv add): dist/../docs/
 * Both resolve to <package-root>/docs/. The directory must be published
 * (see the "files" field of packages/svforge/package.json) — a missing dump
 * is a packaging error and throws rather than scaffolding silently without
 * the references.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const LOCAL_DOCS = ['docs/llms-skeleton.txt', 'docs/llms-svelte.txt'] as const;

/** Read one cached doc relative to the package root (dist/ or src/). */
function readLocalDoc(doc: string): string {
	// URL resolution drops the filename first: one '../' from <root>/src/*.ts
	// (source) or <root>/dist/*.js (bundled) lands on the package root.
	const url = new URL(`../${doc}`, import.meta.url);
	try {
		return readFileSync(fileURLToPath(url), 'utf-8');
	} catch (error) {
		throw new Error(
			`SvelteForge: cached reference ${doc} is missing from the installed package. ` +
				'The docs/ directory must ship with the package (see the svforge package.json "files" field) ' +
				'and can be regenerated with bash packages/svforge/scripts/fetch-llms-docs.sh.',
			{ cause: error }
		);
	}
}

/** The docs/ files (path → content) to scaffold at the project root. */
export function scaffoldedLocalDocs(): Record<string, string> {
	const files: Record<string, string> = {};
	for (const doc of LOCAL_DOCS) {
		files[doc] = readLocalDoc(doc);
	}
	return files;
}
