#!/usr/bin/env node
/**
 * Normalize graphify-out/ artifacts for portability.
 *
 * Raw Graphify output embeds machine-local data that must never be committed
 * and would make CI freshness checks flaky:
 *   - manifest.json records per-file `mtime`/`seen` wall-clock timestamps
 *   - some node ids/labels are derived from the ABSOLUTE checkout path
 *     (e.g. `home_loops_dev_...`), leaking local paths and breaking diffs
 *     between machines/worktrees/clones (see #313 graphify integration)
 *
 * `graphify update` runs this automatically (see .githooks/pre-commit and
 * scripts/check-graphify.mjs) so the committed graph is byte-stable across
 * machines: two runs on the same sources always produce identical files.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(SCRIPT_ROOT, 'graphify-out');

const MANIFEST = join(OUT, 'manifest.json');
const GRAPH = join(OUT, 'graph.json');

/** Strip volatile timestamps from the incremental-extraction manifest. */
function normalizeManifest() {
	const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'));
	for (const entry of Object.values(manifest)) {
		delete entry.mtime;
		delete entry.seen;
	}
	writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n');
}

/**
 * Replace absolute-checkout-path-derived identifiers with a stable root token.
 * Graphify slugifies the checkout directory into some node ids, labels and
 * link endpoints (e.g. /home/loops/dev/svelteforge-hub/svelteForge ->
 * home_loops_dev_svelteforge_hub_svelteforge). The repo directory name is not
 * known statically, so we derive it from `.graphify_root`-style data: any
 * id/label prefix that slugifies THIS checkout path is rewritten to `repo`,
 * and any leftover known-path slug (tmp_<name>_...) is handled by matching
 * against the slug of the current checkout basename.
 */
function normalizeGraph() {
	const graph = JSON.parse(readFileSync(GRAPH, 'utf8'));

	// Root: the slug of THIS checkout path. Graphify slugifies the absolute
	// checkout directory into some node ids/labels/link endpoints, so on any
	// machine those ids start with that machine's path slug. Rewriting it to
	// `repo` makes the graph identical across machines, clones and worktrees.
	const checkoutSlug = slug(SCRIPT_ROOT);
	const roots = checkoutSlug ? [checkoutSlug] : [];

	let rewritten = 0;
	const rewrite = (value) => {
		if (typeof value !== 'string') return value;
		let out = value;
		for (const root of roots) {
			if (out === root) return 'repo';
			if (out.startsWith(root + '_')) {
				out = 'repo' + out.slice(root.length);
				rewritten++;
			}
		}
		return out;
	};

	graph.nodes = graph.nodes.map((node) => {
		const id = rewrite(node.id);
		const label = rewrite(node.label);
		return { ...node, ...(id !== node.id ? { id } : {}), ...(label !== node.label ? { label } : {}) };
	});
	graph.links = graph.links.map((link) => {
		const source = rewrite(link.source);
		const target = rewrite(link.target);
		return { ...link, ...(source !== link.source ? { source } : {}), ...(target !== link.target ? { target } : {}) };
	});

	if (rewritten) {
		console.error(`[normalize-graphify] rewrote ${rewritten} absolute-path identifiers`);
	}
	writeFileSync(GRAPH, JSON.stringify(graph, null, 2) + '\n');
}

/** Slugify a path the same way Graphify does for node ids. */
function slug(path) {
	return path
		.split(/[\\/]/)
		.filter(Boolean)
		.join('_')
		.replace(/[^a-zA-Z0-9_]/g, '_')
		.toLowerCase();
}

normalizeManifest();
normalizeGraph();
console.log('graphify-out normalized (portable, byte-stable).');
