import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, readFileSync, existsSync, rmSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { upgrade, doctor, MODULE_RECIPES } from '../packages/svforge/src';

/**
 * Behavioral tests for #189 — the upgrade/doctor functions must actually work.
 *
 * The previous tests were grep-only and the implementation was a no-op
 * (MODULE_RECIPES had one recipe with files: {}). These tests call the real
 * functions against a temporary project.
 */
describe('svforge upgrade behavioral (#189)', () => {
	let project: string;
	let cleanup: () => void;

	beforeEach(() => {
		const dir = mkdtempSync(join(tmpdir(), 'sf-upgrade-'));
		project = dir;
		cleanup = () => rmSync(dir, { recursive: true, force: true });
	});

	afterEach(() => cleanup());

	it('has real recipes (base + dashboard), not empty files', () => {
		expect(Object.keys(MODULE_RECIPES)).toEqual(expect.arrayContaining(['base', 'dashboard']));
		expect(Object.keys(MODULE_RECIPES.base.files).length).toBeGreaterThan(10);
		expect(Object.keys(MODULE_RECIPES.dashboard.files).length).toBeGreaterThan(
			Object.keys(MODULE_RECIPES.base.files).length
		);
	});

	it('writes files on first upgrade', async () => {
		const result = await upgrade('base', project);
		expect(result.updatedCount).toBeGreaterThan(0);
		// Files are written under src/ (manifest paths are src-relative)
		const anyFile = Object.keys(MODULE_RECIPES.base.files)[0];
		expect(existsSync(join(project, `src${anyFile}`))).toBe(true);
		// Version tracking written
		expect(existsSync(join(project, '.svforge-versions.json'))).toBe(true);
	});

	it('skips user-modified files without --force', async () => {
		await upgrade('base', project);
		// User modifies a file
		const target = Object.keys(MODULE_RECIPES.base.files)[0];
		writeFileSync(join(project, `src${target}`), '// USER EDIT\n');
		const result = await upgrade('base', project);
		const file = result.files.find((f) => f.path === `src${target}`);
		expect(file?.status).toBe('skipped');
		expect(file?.message).toMatch(/Local modifications/);
		expect(result.skippedCount).toBeGreaterThan(0);
		// User edit preserved
		expect(readFileSync(join(project, `src${target}`), 'utf-8')).toContain('USER EDIT');
	});

	it('overwrites with --force and backs up', async () => {
		await upgrade('base', project);
		const target = Object.keys(MODULE_RECIPES.base.files)[0];
		writeFileSync(join(project, `src${target}`), '// USER EDIT\n');
		const result = await upgrade('base', project, { force: true });
		const file = result.files.find((f) => f.path === `src${target}`);
		expect(file?.status).toBe('updated');
		// Backup created
		expect(existsSync(join(project, `src${target}.svforge-backup`))).toBe(true);
		// Content replaced
		expect(readFileSync(join(project, `src${target}`), 'utf-8')).not.toContain('USER EDIT');
	});

	it('rejects unknown modules', async () => {
		await expect(upgrade('nope', project)).rejects.toThrow(/Unknown module/);
	});

	it('a diverging file WITHOUT a baseline (first upgrade) is skipped, never overwritten (#283)', async () => {
		// Project already has the file (e.g. from an old install or user file),
		// but no .svforge-versions.json baseline yet. Any divergence from the
		// template must be treated as a potential user modification.
		const target = Object.keys(MODULE_RECIPES.base.files)[0];
		const template = MODULE_RECIPES.base.files[target];
		mkdirSync(join(project, dirname(`src${target}`)), { recursive: true });
		writeFileSync(join(project, `src${target}`), template + '\n// USER EDIT BEFORE FIRST UPGRADE\n');
		const result = await upgrade('base', project);
		const file = result.files.find((f) => f.path === `src${target}`);
		expect(file?.status).toBe('skipped');
		expect(file?.message).toMatch(/no install baseline/i);
		// The user edit is preserved — the file was NOT overwritten.
		expect(readFileSync(join(project, `src${target}`), 'utf-8')).toContain('USER EDIT BEFORE FIRST UPGRADE');
		// And --force overwrites it (with a backup).
		const forced = await upgrade('base', project, { force: true });
		expect(forced.files.find((f) => f.path === `src${target}`)?.status).toBe('updated');
		expect(existsSync(join(project, `src${target}.svforge-backup`))).toBe(true);
	});

	it('an identical file is reported unchanged, not rewritten (#283)', async () => {
		await upgrade('base', project);
		const target = Object.keys(MODULE_RECIPES.base.files)[0];
		const before = readFileSync(join(project, `src${target}`), 'utf-8');
		const result = await upgrade('base', project);
		const file = result.files.find((f) => f.path === `src${target}`);
		expect(file?.status).toBe('unchanged');
		expect(readFileSync(join(project, `src${target}`), 'utf-8')).toBe(before);
	});

	it('tracking keeps the old baseline for skipped files (#283)', async () => {
		await upgrade('base', project);
		const target = Object.keys(MODULE_RECIPES.base.files)[0];
		// User modifies the file, upgrade skips it.
		writeFileSync(join(project, `src${target}`), '// USER EDIT\n');
		await upgrade('base', project);
		const state = JSON.parse(readFileSync(join(project, '.svforge-versions.json'), 'utf-8'));
		// The recorded checksum must be the ORIGINAL template (what svforge
		// installed), NOT the user edit — otherwise a later upgrade would treat
		// the untouched user edit as "ours" and overwrite it silently.
		expect(state.base.fileChecksums[target]).toBe(checksumOf(MODULE_RECIPES.base.files[target]));
		// A second upgrade still skips the same file.
		const again = await upgrade('base', project);
		expect(again.files.find((f) => f.path === `src${target}`)?.status).toBe('skipped');
	});

	it('recipe versions match the shipped package version (#283)', () => {
		const pkg = JSON.parse(readFileSync(join(process.cwd(), 'packages/svforge/package.json'), 'utf-8'));
		expect(MODULE_RECIPES.base.version).toBe(pkg.version);
		expect(MODULE_RECIPES.dashboard.version).toBe(pkg.version);
	});
});

function checksumOf(content: string): string {
	let hash = 0;
	for (let i = 0; i < content.length; i++) {
		hash = ((hash << 5) - hash + content.charCodeAt(i)) | 0;
	}
	return hash.toString(16);
}

describe('svforge doctor behavioral (#189)', () => {
	it('detects a SvelteKit project via vite.config.ts (modern format, no svelte.config.js)', async () => {
		const dir = mkdtempSync(join(tmpdir(), 'sf-doctor-'));
		try {
			writeFileSync(join(dir, 'vite.config.ts'), 'export default {};');
			writeFileSync(join(dir, 'package.json'), JSON.stringify({ devDependencies: { '@sveltejs/kit': '^2.0.0' } }));
			const report = await doctor(dir);
			const sveltekit = report.results.find((r) => r.module === 'sveltekit');
			expect(sveltekit?.status).toBe('ok');
		} finally {
			rmSync(dir, { recursive: true, force: true });
		}
	});

	it('reports missing svforge components as a warning', async () => {
		const dir = mkdtempSync(join(tmpdir(), 'sf-doctor2-'));
		try {
			const report = await doctor(dir);
			const svforge = report.results.find((r) => r.module === 'svforge');
			expect(svforge?.status).toBe('warn');
		} finally {
			rmSync(dir, { recursive: true, force: true });
		}
	});

	it('never modifies project files', async () => {
		const dir = mkdtempSync(join(tmpdir(), 'sf-doctor3-'));
		try {
			const before = readdirRecursive(dir);
			await doctor(dir);
			expect(readdirRecursive(dir)).toEqual(before);
		} finally {
			rmSync(dir, { recursive: true, force: true });
		}
	});
});

function readdirRecursive(dir: string): string[] {
	const { readdirSync, statSync } = require('node:fs');
	const out: string[] = [];
	for (const entry of readdirSync(dir)) {
		const full = join(dir, entry);
		if (statSync(full).isDirectory()) out.push(...readdirRecursive(full));
		else out.push(full);
	}
	return out;
}
