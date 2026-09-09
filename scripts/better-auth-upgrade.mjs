#!/usr/bin/env node
/**
 * Better Auth upgrade policy engine (#319).
 *
 * The scaffold pins better-auth with a concrete tilde range (never `latest`,
 * per #197). This module is the single source of upgrade-policy logic shared
 * by the `better-auth-upgrade.yml` workflow and its own tests.
 *
 * POLICY (mirrored in .github/workflows/better-auth-upgrade.yml and
 * docs/better-auth-upgrades.md — keep the three in sync):
 *
 *   - BLOCKING SECURITY PATCHES  → auto-PR immediately (daily check).
 *     A critical/high advisory against the pinned version that the latest
 *     stable fixes escalates the cadence from weekly to immediate.
 *   - TESTED MINORS AND PATCHES  → auto-PR weekly. The PR opens ONLY after
 *     the full dashboard scaffold gate (scripts/test-scaffold.sh dashboard)
 *     passes against real PostgreSQL.
 *   - MAJORS                     → explicit migration issue, NEVER a PR.
 *   - PRERELEASES                → never upgraded automatically.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** Files carrying a better-auth stack pin; the bot rewrites all of them. */
export const PIN_FILES = [
	'packages/svforge/src/modes/dashboard.ts',
	'packages/svforge/templates/dashboard/package.json',
	'tests/helpers/fixtures.ts',
	'tests/doctor.test.ts'
];

/** Extracts every `sv.(dev)Dependency('<pkg>', '<range>')` pin from a source. */
export function readPinnedVersions(source) {
	const pins = [];
	const pattern = /sv\.(?:dev)?[Dd]ependency\(\s*'([^']+)',\s*'([^']+)'\s*\)/g;
	for (const match of source.matchAll(pattern)) {
		if (match[1] !== 'better-auth' && match[1] !== '@better-auth/cli') continue;
		pins.push({ name: match[1], range: match[2], version: match[2].replace(/^[~^]/, '') });
	}
	return pins;
}

/**
 * The LIVE better-auth pin, parsed from the dashboard mode source at call
 * time (#319 review): any prose claiming a "current pin" goes stale after
 * the first upgrade PR merges — this never does. Fails loudly when the pin
 * disappears (a silent empty answer would mislead the upgrade bot).
 */
export function currentPin(root = ROOT) {
	const source = readFileSync(join(root, 'packages/svforge/src/modes/dashboard.ts'), 'utf8');
	const pin = readPinnedVersions(source).find((candidate) => candidate.name === 'better-auth');
	if (!pin) {
		throw new Error('currentPin: no better-auth pin found in packages/svforge/src/modes/dashboard.ts');
	}
	return pin;
}

/** Compares two dotted versions: returns -1 | 0 | 1 (prereleases ignored). */
function compareVersions(a, b) {
	const [aCore, aPre] = a.split('-');
	const [bCore, bPre] = b.split('-');
	const aParts = aCore.split('.').map(Number);
	const bParts = bCore.split('.').map(Number);
	for (let i = 0; i < 3; i++) {
		if ((aParts[i] ?? 0) !== (bParts[i] ?? 0)) return (aParts[i] ?? 0) < (bParts[i] ?? 0) ? -1 : 1;
	}
	if (aPre && bPre) return aPre === bPre ? 0 : aPre < bPre ? -1 : 1;
	if (aPre) return -1;
	if (bPre) return 1;
	return 0;
}

/**
 * Classifies a version bump: none | prerelease | major | minor | patch.
 * Prerelease targets are never upgraded automatically — the caller treats
 * them like `none`.
 */
export function classifyBump(current, next) {
	if (compareVersions(next, current) <= 0) return 'none';
	if (/-/.test(next)) return 'prerelease';
	if (next.split('.')[0] !== current.split('.')[0]) return 'major';
	if (next.split('.')[1] !== current.split('.')[1]) return 'minor';
	return 'patch';
}

/** Changelog link for a better-auth stack release (same monorepo). */
export function changelogUrl(name, version) {
	return `https://github.com/better-auth/better-auth/releases/tag/v${version}`;
}

const BLOCKING_SEVERITIES = new Set(['CRITICAL', 'HIGH']);

/**
 * Decides the upgrade mode for one package.
 *
 * @param {{ name: string, pinned: string, latest: string, advisories?: Array<{id: string, severity: string}> }} input
 *   name: package name (better-auth | @better-auth/cli); pinned: currently
 *   pinned version; latest: npm dist-tags.latest; advisories: advisories
 *   affecting the PINNED version (OSV query for the pin) with their
 *   normalized severity.
 * @returns {{mode: 'none'|'weekly'|'security'|'major', bump?: string, advisories?: unknown[]}}
 */
export function planUpgrade({ name, pinned, latest, advisories = [] }) {
	const bump = classifyBump(pinned, latest);
	if (bump === 'none' || bump === 'prerelease') {
		return { mode: 'none', name, pinned, latest };
	}
	if (bump === 'major') {
		return { mode: 'major', bump, name, pinned, latest, changelog: changelogUrl(name, latest) };
	}
	const blockingAdvisories = advisories.filter((a) => BLOCKING_SEVERITIES.has(a.severity));
	return {
		mode: blockingAdvisories.length ? 'security' : 'weekly',
		bump,
		name,
		pinned,
		latest,
		advisories: blockingAdvisories,
		changelog: changelogUrl(name, latest)
	};
}

/**
 * Rewrites the pin of ONE package inside an arbitrary carrier source
 * (sv.dependency call, package.json entry, or TS fixture object).
 * Idempotent: returns the source unchanged when the range already matches.
 * Throws when the package is not declared and `required` is set — a silent
 * no-op would leave one carrier stale while the rest moves.
 */
export function bumpRangeInSource(source, name, version, { required = true } = {}) {
	const nextRange = `~${version}`;

	// Match both styles: sv.dependency('better-auth', '~1.7.3') and
	// "better-auth": "~1.7.3" and { 'better-auth': '~1.7.3' }.
	const patterns = [
		{ pattern: new RegExp(`('${name}',\\s*)'[^']*'`, 'g'), quote: "'" },
		{ pattern: new RegExp(`("${name}"\\s*:\\s*)"[^"]*"`, 'g'), quote: '"' },
		{ pattern: new RegExp(`('${name}'\\s*:\\s*)'[^']*'`, 'g'), quote: "'" }
	];

	let changed = false;
	let out = source;
	for (const { pattern, quote } of patterns) {
		out = out.replace(pattern, (_match, prefix) => {
			changed = true;
			return `${prefix}${quote}${nextRange}${quote}`;
		});
	}
	if (!changed) {
		if (required) {
			throw new Error(`bumpRangeInSource: '${name}' not found in source — refusing to silently skip a pin carrier.`);
		}
		return source;
	}
	return out;
}

/**
 * Rewrites every pin carrier of the repository for the given upgrades.
 *
 * @param {string} root repository root (defaults to this checkout's root)
 * @param {Array<{name: string, version: string}>} upgrades
 * @returns {string[]} the files that were modified
 */
export function applyUpgrades(root = ROOT, upgrades) {
	const changed = [];
	for (const rel of PIN_FILES) {
		const path = join(root, rel);
		let source = readFileSync(path, 'utf8');
		const before = source;
		for (const { name, version } of upgrades) {
			// better-auth must be pinned by EVERY carrier; the CLI is optional
			// (some carriers only pin the runtime package).
			const required = name === 'better-auth';
			source = bumpRangeInSource(source, name, version, { required });
		}
		if (source !== before) {
			writeFileSync(path, source);
			changed.push(rel);
		}
	}
	return changed;
}

/* ------------------------------------------------------------------ */
/* CLI                                                                 */
/* ------------------------------------------------------------------ */

if (import.meta.url === `file://${process.argv[1]}`) {
	const args = process.argv.slice(2);
	const command = args[0];
	const flag = (name) => {
		const index = args.indexOf(`--${name}`);
		return index === -1 ? undefined : args[index + 1];
	};

	if (command === 'pin') {
		const pin = currentPin(flag('root'));
		console.log(`${pin.name} ${pin.range} (live pin source: packages/svforge/src/modes/dashboard.ts)`);
	} else if (command === 'apply') {
		const root = flag('root') ?? ROOT;
		const upgrades = [];
		const betterAuth = flag('better-auth');
		const cli = flag('cli');
		if (betterAuth) upgrades.push({ name: 'better-auth', version: betterAuth });
		if (cli) upgrades.push({ name: '@better-auth/cli', version: cli });
		if (!upgrades.length) {
			console.error('Usage: better-auth-upgrade.mjs apply [--root DIR] [--better-auth 1.7.4] [--cli 1.4.22]');
			process.exitCode = 1;
		} else {
			const changed = applyUpgrades(root, upgrades);
			for (const file of changed) console.log(`bumped: ${file}`);
			if (!changed.length) console.log('no pin changed — repository already at target version');
		}
	} else {
		console.error('Usage: better-auth-upgrade.mjs pin | apply [--root DIR] [--better-auth VERSION] [--cli VERSION]');
		process.exitCode = 1;
	}
}
