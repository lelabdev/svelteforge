#!/usr/bin/env node
/**
 * Parse and validate the repository's machine-readable release changelog.
 * Entries are deliberately package-scoped because every workspace has its own
 * version and release cadence.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(new URL('..', import.meta.url).pathname);
const RELEASE_MARKER = /^<!--\s*svforge-release\s+(.+?)\s*-->$/gm;
const FIELD_HEADINGS = ['Breaking changes', 'Migrations', 'Fixes', 'Deprecations'];

export function parseAttributes(attributes) {
	const values = {};
	for (const match of attributes.matchAll(/([a-z]+)="([^"]*)"/g)) values[match[1]] = match[2];
	return values;
}

export function parseChangelog(content) {
	const markers = [...content.matchAll(RELEASE_MARKER)];
	return markers.map((marker, index) => {
		const attributes = parseAttributes(marker[1]);
		const bodyStart = marker.index + marker[0].length;
		const bodyEnd = markers[index + 1]?.index ?? content.length;
		return {
			package: attributes.package,
			version: attributes.version,
			date: attributes.date,
			body: content.slice(bodyStart, bodyEnd).trim()
		};
	});
}

function validVersion(version) {
	return /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(version);
}

function compareVersions(left, right) {
	const parse = (version) => version.split(/[.-]/).map((part) => (/^\d+$/.test(part) ? Number(part) : part));
	const a = parse(left);
	const b = parse(right);
	for (let index = 0; index < 3; index++) {
		if (a[index] !== b[index]) return a[index] - b[index];
	}
	return 0;
}

export function validateChangelog(content, packages) {
	const entries = parseChangelog(content);
	const expected = new Map(packages.map((pkg) => [pkg.name, pkg.version]));
	const errors = [];
	const seen = new Set();

	for (const entry of entries) {
		if (!entry.package || !entry.version || !entry.date) {
			errors.push('Every release marker must define package, version, and date.');
			continue;
		}
		if (!validVersion(entry.version)) errors.push(`${entry.package}@${entry.version}: invalid semantic version.`);
		if (!/^\d{4}-\d{2}-\d{2}$/.test(entry.date)) errors.push(`${entry.package}@${entry.version}: date must be YYYY-MM-DD.`);
		const key = `${entry.package}@${entry.version}`;
		if (seen.has(key)) errors.push(`${key}: duplicate changelog entry.`);
		seen.add(key);
		for (const heading of FIELD_HEADINGS) {
			if (!new RegExp(`^### ${heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'mi').test(entry.body)) {
				errors.push(`${key}: missing "${heading}" section.`);
			}
		}
	}

	for (const [name, version] of expected) {
		if (!seen.has(`${name}@${version}`)) errors.push(`${name}@${version}: missing current release entry.`);
	}

	return { valid: errors.length === 0, errors, entries };
}

export function entriesBetween(entries, packageName, fromVersion, toVersion) {
	return entries
		.filter((entry) => entry.package === packageName)
		.filter((entry) => (!fromVersion || compareVersions(entry.version, fromVersion) > 0) && compareVersions(entry.version, toVersion) <= 0)
		.sort((left, right) => compareVersions(left.version, right.version));
}

export function readChangelog(root = ROOT) {
	const path = join(root, 'CHANGELOG.md');
	if (!existsSync(path)) throw new Error(`Missing ${path}.`);
	return readFileSync(path, 'utf8');
}

if (import.meta.url === `file://${process.argv[1]}`) {
	const content = readChangelog();
	const packages = readdirSync(join(ROOT, 'packages'), { withFileTypes: true })
		.filter((entry) => entry.isDirectory() && existsSync(join(ROOT, 'packages', entry.name, 'package.json')))
		.map((entry) => JSON.parse(readFileSync(join(ROOT, 'packages', entry.name, 'package.json'), 'utf8')));
	const result = validateChangelog(content, packages);
	if (!result.valid) {
		for (const error of result.errors) console.error(`Changelog error: ${error}`);
		process.exitCode = 1;
	} else {
		console.log(`Changelog OK: ${result.entries.length} release entries.`);
	}
}
