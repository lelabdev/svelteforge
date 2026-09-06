#!/usr/bin/env node
/**
 * Generated-manifest freshness gate (#329).
 *
 * Every package manifest is AUTO-GENERATED (src/templates.ts) from its
 * templates/ directory by the package prebuild script. A template edit
 * without regeneration commits a stale manifest while CI stays green,
 * because the build regenerates before the freshness tests run.
 *
 * This gate runs every prebuild on a clean checkout and then fails if the
 * regeneration produced any diff, before any later step can hide it.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

export const FIX_COMMAND = "bun run --filter '*' build";
export const FIX_ADVICE =
	'Review the regenerated files, then stage and commit them explicitly\n' +
	'(including newly generated files — do not blind-commit with -a).';

/** Discover every workspace package that generates artifacts via a prebuild script. */
export function discoverPrebuildPackages(root = SCRIPT_ROOT) {
	return readdirSync(join(root, 'packages'), { withFileTypes: true })
		.filter((entry) => entry.isDirectory())
		.map((entry) => {
			const manifestPath = join(root, 'packages', entry.name, 'package.json');
			if (!existsSync(manifestPath)) return null;
			const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
			if (!manifest.scripts?.prebuild) return null;
			return { name: manifest.name ?? entry.name, directory: `packages/${entry.name}` };
		})
		// flatMap keeps the inferred element type non-null (filter(Boolean) does not).
		.flatMap((entry) => (entry ? [entry] : []))
		.sort((left, right) => left.name.localeCompare(right.name));
}

function run(command, args, cwd) {
	const result = spawnSync(command, args, { cwd, encoding: 'utf8' });
	if (result.error) throw result.error;
	if (result.status !== 0) {
		throw new Error(`${command} ${args.join(' ')} failed in ${cwd}:\n${result.stderr || result.stdout}`);
	}
	return result;
}

/** Fail with the exact remediation when regeneration dirties the checkout. */
export function assertNoDrift(root = SCRIPT_ROOT, git = (args) => run('git', args, root)) {
	const status = git(['status', '--porcelain']);
	const drift = status.stdout.split('\n').map((line) => line.trim()).filter(Boolean);
	if (drift.length) {
		throw new Error(
			`Stale generated files committed (#329). Regeneration changed:\n` +
			drift.map((line) => `  ${line}`).join('\n') +
			`\nRegenerate with:\n  ${FIX_COMMAND}\n${FIX_ADVICE}`
		);
	}
	return drift;
}

export function checkGenerated(root = SCRIPT_ROOT, git) {
	const packages = discoverPrebuildPackages(root);
	if (!packages.length) throw new Error('No package with a prebuild script found.');
	for (const pkg of packages) {
		run('bun', ['run', 'prebuild'], join(root, pkg.directory));
	}
	assertNoDrift(root, git);
	console.log(`Generated manifests fresh for ${packages.length} package(s).`);
	return packages;
}

if (import.meta.url === `file://${process.argv[1]}`) {
	try {
		checkGenerated();
	} catch (error) {
		console.error(`Generated-manifest check failed: ${error.message}`);
		process.exitCode = 1;
	}
}
