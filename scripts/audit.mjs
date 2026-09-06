#!/usr/bin/env node
/**
 * Dependency vulnerability audit (#351).
 *
 * Queries the public OSV.dev API with every resolved package version from
 * bun.lock (no extra dependency, npm-ecosystem advisories).
 *
 * Network-transient behavior: each OSV request is retried up to MAX_ATTEMPTS
 * with linear backoff. If the API remains unreachable after that, the audit
 * FAILS — an unreachable registry never silently passes real findings.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OSV_BATCH_URL = 'https://api.osv.dev/v1/querybatch';
const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 2000;

/** Strip JSONC line/block comments and trailing commas, respecting string literals. */
export function stripJsonc(source) {
	let out = '';
	let inString = false;
	let escaped = false;
	for (let index = 0; index < source.length; index++) {
		const char = source[index];
		const next = source[index + 1];
		if (inString) {
			out += char;
			if (escaped) escaped = false;
			else if (char === '\\') escaped = true;
			else if (char === '"') inString = false;
			continue;
		}
		if (char === '"') {
			inString = true;
			out += char;
		} else if (char === '/' && next === '/') {
			while (index < source.length && source[index] !== '\n') index++;
			out += ' ';
		} else if (char === '/' && next === '*') {
			index += 2;
			while (index < source.length && !(source[index] === '*' && source[index + 1] === '/')) index++;
			index++;
			out += ' ';
		} else if (char === ',') {
			let look = index + 1;
			while (look < source.length && /\s/.test(source[look])) look++;
			// Drop commas directly before a closing brace/bracket (trailing comma).
			if (source[look] === '}' || source[look] === ']') continue;
			out += char;
		} else {
			out += char;
		}
	}
	return out;
}

/** Extract every resolved { name, version } from bun.lock ("packages" map). */
export function resolvedPackages(lockfile = readFileSync(resolve(ROOT, 'bun.lock'), 'utf8')) {
	const json = JSON.parse(stripJsonc(lockfile));
	const packages = [];
	for (const [key, entry] of Object.entries(json.packages ?? {})) {
		const resolved = Array.isArray(entry) ? entry[0] : entry;
		if (typeof resolved !== 'string') continue;
		const at = resolved.lastIndexOf('@');
		if (at <= 0) continue;
		packages.push({ name: resolved.slice(0, at), version: resolved.slice(at + 1), paths: key });
	}
	return packages;
}

function sleep(ms) {
	return new Promise((resolvePromise) => setTimeout(resolvePromise, ms));
}

const isTransientNetworkError = (error) =>
	error?.cause?.code === 'ECONNRESET'
	|| error?.cause?.code === 'ENOTFOUND'
	|| error?.cause?.code === 'ETIMEDOUT'
	|| error?.cause?.code === 'EAI_AGAIN';

export async function queryOsv(packages, fetchImpl = fetch, { retryDelayMs = RETRY_DELAY_MS, maxAttempts = MAX_ATTEMPTS } = {}) {
	for (let attempt = 1; attempt <= maxAttempts; attempt++) {
		try {
			const response = await fetchImpl(OSV_BATCH_URL, {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({
					queries: packages.map((pkg) => ({ package: { name: pkg.name, ecosystem: 'npm', version: pkg.version } }))
				}),
				signal: AbortSignal.timeout(30_000)
			});
			if (!response.ok) throw new Error(`OSV API returned HTTP ${response.status}`);
			return await response.json();
		} catch (error) {
			const transient = isTransientNetworkError(error) || error.name === 'TimeoutError' || /HTTP 5\d\d/.test(error.message);
			if (attempt === maxAttempts || !transient) {
				throw new Error(
					`OSV audit could not complete after ${attempt} attempt(s) — refusing to pass on an unverified dependency tree.\n${error.message}`,
					{ cause: error }
				);
			}
			await sleep(retryDelayMs * attempt);
		}
	}
}

export function formatFindings(packages, results) {
	const findings = [];
	for (const [index, result] of (results?.results ?? []).entries()) {
		for (const vuln of result.vulns ?? []) {
			const pkg = packages[index];
			const advisory = [vuln.id, ...(vuln.aliases ?? [])].join(', ');
			findings.push({
				package: `${pkg.name}@${pkg.version}`,
				path: pkg.paths,
				advisory,
				ids: [vuln.id, ...(vuln.aliases ?? [])],
				summary: (vuln.summary ?? 'no summary').trim()
			});
		}
	}
	return findings;
}

const BASELINE_PATH = resolve(ROOT, 'docs', 'audit-baseline.txt');

export function loadBaseline(path = BASELINE_PATH) {
	try {
		return new Set(
			readFileSync(path, 'utf8')
				.split('\n')
				.map((line) => line.trim())
				.filter((line) => line && !line.startsWith('#'))
			);
	} catch {
		return new Set();
	}
}

export async function audit({ updateBaseline = false } = {}) {
	const packages = resolvedPackages();
	const results = await queryOsv(packages);
	const findings = formatFindings(packages, results);
	const baseline = loadBaseline();
	const unknown = findings.filter((finding) => !finding.ids.some((id) => baseline.has(id)));

	if (updateBaseline) {
		const merged = new Set([...baseline, ...findings.flatMap((finding) => finding.ids)]);
		writeFileSync(
			BASELINE_PATH,
			`# Dependency-audit baseline (#351).\n` +
			`# One advisory ID per line. OSV.dev reports these against the current\n` +
			`# bun.lock (dev and transitive deps included). New advisories FAIL CI;\n` +
			`# regenerate with: bun run audit --update-baseline\n` +
			[...merged].sort().map((id) => `${id}\n`).join('')
		);
		console.log(`Baseline updated: ${merged.size} known advisories.`);
		return { findings, unknown };
	}

	if (unknown.length) {
		throw new Error(
			`${unknown.length} NEW vulnerable package version(s) not in the audit baseline:\n` +
			unknown.map((finding) => `- ${finding.package} [${finding.path}]\n  ${finding.advisory}\n  ${finding.summary}`).join('\n') +
			'\nRemediate with `bun update <package>` or extend docs/audit-baseline.txt with a documented reason.'
		);
	}
	console.log(`Dependency audit OK: ${packages.length} resolved versions, ${findings.length} known advisories (baselined), 0 new.`);
	return { findings, unknown };
}

if (import.meta.url === `file://${process.argv[1]}`) {
	audit({ updateBaseline: process.argv.includes('--update-baseline') }).catch((error) => {
		console.error(`Dependency audit failed: ${error.message}`);
		process.exitCode = 1;
	});
}
