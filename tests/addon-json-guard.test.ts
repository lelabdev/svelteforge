import { describe, it, expect, afterEach } from 'vitest';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
	JsonGuardError,
	parseJsonFile,
	planCatalogMerges,
	planManifestEnrich,
	validateManifestShape
} from '../packages/addon-kit/src/index';
import { tempProject } from './helpers';
import { createDashboardProject, diskSv } from './helpers/fixtures';

/**
 * Behavioral tests for #324 — addon JSON merges must never destroy user
 * content. The old inline helpers used `try { JSON.parse } catch { {} }`:
 * one syntax error in .svforge.json or messages/{locale}.json made the addon
 * start from an empty object and REWRITE the file, silently losing user keys.
 *
 * The contract now:
 * 1. invalid JSON → installation fails with path + diagnostic + remediation;
 * 2. valid JSON with an invalid shape → precise diagnostic;
 * 3. ALL files are read, validated and merged in memory BEFORE any write —
 *    a failure in the second catalog leaves the first catalog untouched;
 * 4. valid customized catalogs keep every existing key;
 * 5. reinstall is idempotent.
 *
 * Tests run the REAL addon `run()` (audit) against a disk-backed sv fake with
 * the same write semantics as the sv engine.
 */
describe('#324 — addon JSON guard', () => {
	let cleanup: (() => void) | undefined;
	afterEach(() => cleanup?.());

	function project() {
		const { dir, cleanup: done } = tempProject('sf-json-guard-');
		cleanup = done;
		createDashboardProject(dir);
		return dir;
	}

	describe('parseJsonFile', () => {
		it('reports path, diagnostic and remediation on invalid syntax', () => {
			const result = parseJsonFile('messages/fr.json', '{ "broken": true,, }');
			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.error).toBeInstanceOf(JsonGuardError);
				expect(result.error.message).toContain('messages/fr.json');
				expect(result.error.message).toMatch(/JSON|position|line/i);
				expect(result.error.message).toMatch(/fix|remediation|example|valid/i);
			}
		});

		it('parses valid JSON', () => {
			const result = parseJsonFile('messages/fr.json', '{"a":1}');
			expect(result.ok).toBe(true);
		});
	});

	describe('planCatalogMerges (messages/{locale}.json)', () => {
		it('fails with the file path and does not transform anything when the first catalog is corrupted', () => {
			const dir = project();
			writeFile(dir, 'messages/fr.json', '{ "oops" '); // syntax error
			const plan = planCatalogMerges(dir, [
				{ path: 'messages/fr.json', additions: { audit_title: 'Journal' } },
				{ path: 'messages/en.json', additions: { audit_title: 'Audit log' } }
			]);
			expect(plan.ok).toBe(false);
			if (!plan.ok) expect(plan.error).toContain('messages/fr.json');
		});

		it('a failure in the second catalog leaves the first catalog computable but unwritten (plan reports both)', () => {
			const dir = project();
			writeFile(dir, 'messages/en.json', '{ invalid');
			const plan = planCatalogMerges(dir, [
				{ path: 'messages/fr.json', additions: { audit_title: 'Journal' } },
				{ path: 'messages/en.json', additions: { audit_title: 'Audit log' } }
			]);
			expect(plan.ok).toBe(false);
			if (!plan.ok) {
				expect(plan.error).toContain('messages/en.json');
				// The message must make clear NOTHING was written.
				expect(plan.error).toMatch(/no files? (were|has been) (written|modified)|nothing was written/i);
			}
		});

		it('valid JSON with an invalid shape gives a precise diagnostic (array catalog, non-string value)', () => {
			const dir = project();
			writeFile(dir, 'messages/fr.json', '["not", "a", "catalog"]');
			const plan = planCatalogMerges(dir, [{ path: 'messages/fr.json', additions: { k: 'v' } }]);
			expect(plan.ok).toBe(false);
			if (!plan.ok) expect(plan.error).toMatch(/messages\/fr\.json.*(object|catalog)/i);

			writeFile(dir, 'messages/fr.json', '{"nested": {"a": 1}}');
			const plan2 = planCatalogMerges(dir, [{ path: 'messages/fr.json', additions: { k: 'v' } }]);
			expect(plan2.ok).toBe(false);
			if (!plan2.ok) expect(plan2.error).toMatch(/nested/);
		});

		it('a valid customized catalog keeps every existing key and the $schema header', () => {
			const dir = project();
			const plan = planCatalogMerges(dir, [
				{ path: 'messages/fr.json', additions: { hello: 'OVERRIDE ATTEMPT', audit_title: 'Journal d’audit' } }
			]);
			expect(plan.ok).toBe(true);
			if (plan.ok) {
				const write = plan.writes.find((w) => w.path === 'messages/fr.json');
				expect(write).toBeDefined();
				const merged = JSON.parse(write!.content);
				expect(merged.hello).toBe('bonjour'); // user customization preserved
				expect(merged.$schema).toBe('https://inlang.com/schema/inlang-message-format');
				expect(merged.audit_title).toBe('Journal d’audit');
				// $schema stays the first key
				expect(Object.keys(merged)[0]).toBe('$schema');
			}
		});

		it('is idempotent: merging the same additions twice produces identical content', () => {
			const dir = project();
			const entries = [{ path: 'messages/fr.json', additions: { audit_title: 'Journal' } }];
			const plan1 = planCatalogMerges(dir, entries);
			expect(plan1.ok).toBe(true);
			if (!plan1.ok) return;
			expect(plan1.writes).toHaveLength(1);
			writeFile(dir, 'messages/fr.json', plan1.writes[0].content);
			const plan2 = planCatalogMerges(dir, entries);
			expect(plan2.ok).toBe(true);
			if (plan2.ok) {
				// Nothing left to change on disk: the merge already happened.
				expect(plan2.writes).toHaveLength(0);
			}
		});
	});

	describe('planManifestEnrich (.svforge.json)', () => {
		const enrich = { moduleId: 'audit', capability: 'audit trail', pattern: 'src/lib/server/audit/' };

		it('rejects an empty {} capability block with a clear diagnostic (remediation round #324)', () => {
			const problems = validateManifestShape({ moduleCapabilities: { audit: {} } }, '.svforge.json');
			expect(problems.length).toBeGreaterThan(0);
			expect(problems[0]).toMatch(/moduleCapabilities\["audit"\]/);
			expect(problems[0]).toMatch(/empty capability block/);
			const dir = project();
			writeFile(dir, '.svforge.json', '{"moduleCapabilities": {"audit": {}}}');
			const plan = planManifestEnrich(dir, enrich);
			expect(plan.ok).toBe(false);
			if (!plan.ok) expect(plan.error).toMatch(/empty capability block/);
		});

		it('moduleCapabilities entries with NON-ARRAY provides/requires give a diagnostic — never a TypeError', () => {
			// The previous implementation spread `(entry.provides ?? [])`: a number
			// or boolean crashed validateManifestShape with a raw TypeError instead
			// of a diagnosable failure.
			for (const bad of [5, true, 'audit']) {
				const problems = validateManifestShape(
					{ moduleCapabilities: { audit: { provides: bad, requires: ['ui.skeleton'] } } },
					'.svforge.json'
				);
				expect(problems.length, String(bad)).toBeGreaterThan(0);
				expect(problems[0]).toMatch(/must be arrays of strings/);
				expect(problems[0]).toContain('audit');
			}
			const dir = project();
			writeFile(dir, '.svforge.json', '{"moduleCapabilities": {"audit": {"provides": 5, "requires": false}}}');
			const plan = planManifestEnrich(dir, enrich);
			expect(plan.ok).toBe(false);
			if (!plan.ok) {
				expect(plan.error).toMatch(/moduleCapabilities\["audit"\]/);
				expect(plan.error).toMatch(/arrays of strings/);
				expect(plan.error).toMatch(/No files were written/);
			}
		});

		it('rejects non-object moduleCapabilities entries with the offending module id', () => {
			const problems = validateManifestShape({ moduleCapabilities: { audit: 'nope' } }, '.svforge.json');
			expect(problems.length).toBeGreaterThan(0);
			expect(problems[0]).toMatch(/moduleCapabilities\["audit"\]/);
		});

		it('accepts the exact shape the tooling writes: { provides: [], requires: [] }', () => {
			const problems = validateManifestShape(
				{ moduleCapabilities: { audit: { provides: [], requires: ['auth.currentUser'] } } },
				'.svforge.json'
			);
			expect(problems).toEqual([]);
		});

		it('only ENOENT means absent: an unreadable manifest surfaces with its path instead of being reset', () => {
			const dir = project();
			rmSync(join(dir, '.svforge.json'), { force: true });
			mkdirSync(join(dir, '.svforge.json')); // EISDIR on read
			expect(() => planManifestEnrich(dir, enrich)).toThrow(/cannot read/);
			expect(() => planManifestEnrich(dir, enrich)).toThrow(/\.svforge\.json/);
		});

		it('fails with path + diagnostic + remediation on invalid JSON', () => {
			const dir = project();
			writeFile(dir, '.svforge.json', '{ "modules": [ ],,');
			const plan = planManifestEnrich(dir, enrich);
			expect(plan.ok).toBe(false);
			if (!plan.ok) {
				expect(plan.error).toContain('.svforge.json');
				expect(plan.error).toMatch(/fix|valid|remediation|example/i);
			}
		});

		it('fails with a precise diagnostic on a wrong shape (modules as string, capabilities as object)', () => {
			const dir = project();
			writeFile(dir, '.svforge.json', '{"modules": "not-an-array"}');
			const plan = planManifestEnrich(dir, enrich);
			expect(plan.ok).toBe(false);
			if (!plan.ok) expect(plan.error).toMatch(/modules/);

			writeFile(dir, '.svforge.json', '{"capabilities": {"a": 1}}');
			const plan2 = planManifestEnrich(dir, enrich);
			expect(plan2.ok).toBe(false);
			if (!plan2.ok) expect(plan2.error).toMatch(/capabilities/);
		});

		it('enriches an existing manifest and preserves unknown user keys', () => {
			const dir = project();
			writeFile(
				dir,
				'.svforge.json',
				JSON.stringify({ ...JSON.parse(readFileSync(join(dir, '.svforge.json'), 'utf8')), teamNote: 'keep me' })
			);
			const plan = planManifestEnrich(dir, enrich);
			expect(plan.ok).toBe(true);
			if (plan.ok) {
				const merged = JSON.parse(plan.writes[0].content);
				expect(merged.teamNote).toBe('keep me');
				expect(merged.modules).toContain('audit');
				expect(merged.capabilities).toContain('audit trail');
				expect(merged.patterns['audit trail']).toBe('src/lib/server/audit/');
			}
		});

		it('is idempotent: enriching twice adds no duplicate module/capability', () => {
			const dir = project();
			const plan1 = planManifestEnrich(dir, enrich);
			expect(plan1.ok).toBe(true);
			if (!plan1.ok) return;
			writeFile(dir, '.svforge.json', plan1.writes[0].content);
			const plan2 = planManifestEnrich(dir, enrich);
			expect(plan2.ok).toBe(true);
			if (!plan2.ok) return;
			const manifest = JSON.parse(plan2.writes[0].content);
			expect(manifest.modules.filter((m: string) => m === 'audit')).toHaveLength(1);
			expect(manifest.capabilities.filter((c: string) => c === 'audit trail')).toHaveLength(1);
		});
	});

	describe('REAL addon run — no partial writes on failure (@svforge/audit)', () => {
		it('corrupted messages/fr.json cancels the install and leaves EVERY file untouched', async () => {
			const dir = project();
			writeFile(dir, 'messages/fr.json', '{ "broken"');
			const before = snapshot(dir);

			const { default: auditAddon } = await import('../packages/audit/src/index');
			const outcome = await runAddon(dir, auditAddon);

			expect(outcome.cancelReason).toContain('messages/fr.json');
			expect(outcome.cancelReason).toMatch(/fix|valid|remediation|example/i);
			// Byte-for-byte preservation: nothing written, nothing rewritten.
			expect(outcome.written).toEqual([]);
			expect(snapshot(dir)).toEqual(before);
			expect(existsSync(join(dir, 'src/lib/server/audit'))).toBe(false);
		});

		it('failure in the SECOND catalog leaves the first catalog byte-identical', async () => {
			const dir = project();
			const frBefore = readFileSync(join(dir, 'messages/fr.json'));
			writeFile(dir, 'messages/en.json', 'not json at all');

			const { default: auditAddon } = await import('../packages/audit/src/index');
			const outcome = await runAddon(dir, auditAddon);

			expect(outcome.cancelReason).toContain('messages/en.json');
			expect(readFileSync(join(dir, 'messages/fr.json'))).toEqual(frBefore);
			expect(outcome.written).toEqual([]);
		});

		it('corrupted .svforge.json cancels before any write', async () => {
			const dir = project();
			writeFile(dir, '.svforge.json', '{"modules": [}');
			const before = snapshot(dir);

			const { default: auditAddon } = await import('../packages/audit/src/index');
			const outcome = await runAddon(dir, auditAddon);

			expect(outcome.cancelReason).toContain('.svforge.json');
			expect(outcome.written).toEqual([]);
			expect(snapshot(dir)).toEqual(before);
		});

		it('valid customized catalogs: existing keys preserved, module content installed, manifest enriched', async () => {
			const dir = project();
			writeFile(dir, 'messages/fr.json', `${JSON.stringify({ $schema: 'https://inlang.com/schema/inlang-message-format', hello: 'salut' }, null, 2)}\n`);

			const { default: auditAddon } = await import('../packages/audit/src/index');
			const outcome = await runAddon(dir, auditAddon);

			expect(outcome.cancelReason).toBeUndefined();
			const fr = JSON.parse(readFileSync(join(dir, 'messages/fr.json'), 'utf8'));
			expect(fr.hello).toBe('salut');
			expect(fr.audit_title).toBeTruthy();
			const manifest = JSON.parse(readFileSync(join(dir, '.svforge.json'), 'utf8'));
			expect(manifest.modules).toContain('audit');
			expect(manifest.capabilities).toContain('audit trail');
			expect(existsSync(join(dir, 'src/lib/server/audit/index.ts'))).toBe(true);
		});

		it('reinstallation is idempotent (second run = no duplicate keys, stable manifest)', async () => {
			const dir = project();
			const { default: auditAddon } = await import('../packages/audit/src/index');
			await runAddon(dir, auditAddon);
			const afterFirst = snapshot(dir);

			await runAddon(dir, auditAddon);
			const afterSecond = snapshot(dir);
			// The only acceptable diff is none: same files, same content.
			expect(afterSecond).toEqual(afterFirst);
		});

		it('EVERY module plans before writing: corrupted manifest ⇒ zero writes across the fleet', async () => {
			// Guards the module-side ORDERING (gate → plans → writes): a module
			// that writes template files before planning would partially install
			// instead of cancelling cleanly.
			const { MODULE_CAPABILITIES } = await import('../packages/svforge/src/ai-context');
			const { createBaseProject, createDashboardProject } = await import('./helpers/fixtures');
			const DASH_CAPS = new Set(['auth.currentUser', 'auth.admin', 'database.drizzle.postgres']);
			const { MODULE_CONTRACTS } = await import('../packages/addon-kit/src/index');

			for (const mod of Object.keys(MODULE_CAPABILITIES)) {
				const { dir, cleanup: done } = tempProject(`sf-fleet-${mod}-`);
				try {
					if (MODULE_CONTRACTS[mod].requires.some((c) => DASH_CAPS.has(c))) createDashboardProject(dir);
					else createBaseProject(dir);
					writeFile(dir, '.svforge.json', '{ "corrupted"');
					const before = snapshot(dir);

					const { default: addon } = await import(`../packages/${mod}/src/index`);
					const outcome = await runAddon(dir, addon);

					expect(outcome.cancelReason, `${mod} should cancel on corrupt manifest`).toContain('.svforge.json');
					expect(outcome.written, `${mod} wrote files despite cancelling`).toEqual([]);
					expect(snapshot(dir), `${mod} partially installed`).toEqual(before);
				} finally {
					done();
				}
			}
		});
	});
});

// ── tiny disk helpers ──

function writeFile(root: string, rel: string, content: string): void {
	writeFileSync(join(root, rel), content);
}

function snapshot(root: string): Map<string, string> {
	const out = new Map<string, string>();
	const walk = (dir: string) => {
		for (const entry of readdirSync(dir, { withFileTypes: true })) {
			const full = join(dir, entry.name);
			if (entry.isDirectory()) walk(full);
			else out.set(full, readFileSync(full).toString('hex'));
		}
	};
	walk(root);
	return out;
}

async function runAddon(
	dir: string,
	// The real sv engine calls run() with its own Workspace shape; the mock
	// mirrors it loosely.
	addon: { run: (ctx: any) => unknown }
): Promise<{ cancelReason: string | undefined; written: string[] }> {
	let cancelReason: string | undefined;
	const sv = diskSv(dir);
	await addon.run({
		sv,
		cancel: (reason: string) => {
			cancelReason = reason;
		},
		cwd: dir,
		options: {}
	});
	return { cancelReason, written: sv.written };
}
