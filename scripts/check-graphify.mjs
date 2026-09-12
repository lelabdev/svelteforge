#!/usr/bin/env node
/**
 * Graphify knowledge-graph freshness gate.
 *
 * graphify-out/ is committed (official Graphify recommendation) so clones and
 * worktrees start from an existing graph. A source change without running
 * `graphify update .` commits a stale graph while CI stays green.
 *
 * `graphify check-update .` only reports the pending *semantic* (LLM)
 * re-extraction flag and exits 0 even when the AST graph is stale (verified
 * on graphify 0.9.59), so it cannot serve as a freshness gate. Instead this
 * gate regenerates the graph locally with the same deterministic command the
 * pre-commit hook uses (`graphify update . --no-cluster`, no LLM, no network)
 * and fails on any diff — the same pattern as the generated-manifest gate
 * (scripts/check-generated.mjs, #329). It never commits or pushes anything.
 */
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

export const FIX_COMMAND = 'graphify update . && git add graphify-out';
export const FIX_ADVICE =
	`Run graphify update . and commit graphify-out/.`;
const PINNED_VERSION = '0.9.59';

function run(command, args) {
	const result = spawnSync(command, args, { cwd: SCRIPT_ROOT, encoding: 'utf8' });
	if (result.error) throw result.error;
	return result;
}

function fail(message) {
	console.error(`Graphify freshness gate failed: ${message}`);
	console.error(`\n${FIX_ADVICE}`);
	process.exitCode = 1;
}

function checkGraphify() {
	const result = run('graphify', ['--version']);
	if (result.error || result.status !== 0) {
		fail(
			`graphify CLI not found. Install it with:\n  uv tool install graphifyy==${PINNED_VERSION}\n(package: graphifyy, executable: graphify)`
		);
		return false;
	}
	const version = (result.stdout || '').trim().replace(/^graphify\s+/, '');
	if (version !== PINNED_VERSION) {
		console.warn(
			`graphify version mismatch: found ${version}, CI pins ${PINNED_VERSION}. ` +
				`Update with: uv tool install graphifyy==${PINNED_VERSION}`
		);
	}
	return true;
}

export function checkGraphifyFreshness() {
	if (!checkGraphify()) return false;

	const update = run('graphify', ['update', '.', '--no-cluster']);
	if (update.status !== 0) {
		fail(`graphify update . --no-cluster exited ${update.status}:\n${update.stderr || update.stdout}`);
		return false;
	}

	// Scrub machine-local data exactly like the pre-commit hook does, so the
	// comparison below is against the same normalized form contributors commit.
	run('node', [join(SCRIPT_ROOT, 'scripts', 'normalize-graphify.mjs')]);

	// Freshness = the committed graph matches a local regeneration. Only the
	// tracked graph set is diffed; ignored local artifacts (cache/, backups)
	// cannot fail the gate.
	const diff = run('git', ['diff', '--exit-code', '--', 'graphify-out']);
	if (diff.status !== 0) {
		const stale = run('git', ['diff', '--name-only', '--', 'graphify-out']);
		fail(
			`Stale knowledge graph committed. Regeneration changed:\n` +
				stale.stdout
					.split('\n')
					.filter(Boolean)
					.map((line) => `  ${line}`)
					.join('\n')
		);
		return false;
	}

	console.log('Graphify knowledge graph is fresh.');
	return true;
}

if (import.meta.url === `file://${process.argv[1]}`) {
	checkGraphifyFreshness();
}
