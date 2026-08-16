import { describe, it, expect } from 'vitest';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { doctor } from '../packages/svforge/src';

/**
 * Behavioral tests for #178/#189 — svforge doctor runs real diagnostics.
 *
 * Previous tests were grep-only; the svelte.config.js check was obsolete
 * (modern sv create has no svelte.config.js — it would report ERROR on a
 * healthy project). These tests call the real doctor() on temp projects.
 */
describe('svforge doctor behavioral (#178/#189)', () => {
	it('is read-only — never creates or modifies files', async () => {
		const dir = mkdtempSync(join(tmpdir(), 'sf-doc-ro-'));
		try {
			await doctor(dir);
			// Temp dir must stay empty
			const { readdirSync } = await import('node:fs');
			expect(readdirSync(dir)).toEqual([]);
		} finally {
			rmSync(dir, { recursive: true, force: true });
		}
	});

	it('detects SvelteKit via vite.config.ts (modern format)', async () => {
		const dir = mkdtempSync(join(tmpdir(), 'sf-doc-vite-'));
		try {
			writeFileSync(join(dir, 'vite.config.ts'), 'export default {};');
			writeFileSync(
				join(dir, 'package.json'),
				JSON.stringify({ devDependencies: { '@sveltejs/kit': '^2.0.0' } })
			);
			const report = await doctor(dir);
			const kit = report.results.find((r) => r.module === 'sveltekit');
			expect(kit?.status).toBe('ok');
		} finally {
			rmSync(dir, { recursive: true, force: true });
		}
	});

	it('still detects SvelteKit via legacy svelte.config.js', async () => {
		const dir = mkdtempSync(join(tmpdir(), 'sf-doc-svelte-'));
		try {
			writeFileSync(join(dir, 'svelte.config.js'), 'export default {};');
			const report = await doctor(dir);
			const kit = report.results.find((r) => r.module === 'sveltekit');
			expect(kit?.status).toBe('ok');
		} finally {
			rmSync(dir, { recursive: true, force: true });
		}
	});

	it('reports a missing svforge components dir as warn (not error)', async () => {
		const dir = mkdtempSync(join(tmpdir(), 'sf-doc-warn-'));
		try {
			writeFileSync(join(dir, 'vite.config.ts'), 'export default {};');
			writeFileSync(
				join(dir, 'package.json'),
				JSON.stringify({ devDependencies: { '@sveltejs/kit': '^2.0.0' } })
			);
			const report = await doctor(dir);
			const svforge = report.results.find((r) => r.module === 'svforge');
			expect(svforge?.status).toBe('warn');
		} finally {
			rmSync(dir, { recursive: true, force: true });
		}
	});

	it('checks env vars from .env', async () => {
		const dir = mkdtempSync(join(tmpdir(), 'sf-doc-env-'));
		try {
			writeFileSync(join(dir, '.env'), 'DATABASE_URL="file:local.db"\n');
			const report = await doctor(dir);
			const db = report.results.find((r) => r.message.includes('DATABASE_URL'));
			expect(db?.status).toBe('ok');
		} finally {
			rmSync(dir, { recursive: true, force: true });
		}
	});

	it('reports dependency checks from package.json', async () => {
		const dir = mkdtempSync(join(tmpdir(), 'sf-doc-dep-'));
		try {
			writeFileSync(
				join(dir, 'package.json'),
				JSON.stringify({
					devDependencies: { svelte: '^5.0.0', '@skeletonlabs/skeleton-svelte': '^5.0.0' }
				})
			);
			const report = await doctor(dir);
			expect(report.results.some((r) => r.module === 'svelte' && r.status === 'ok')).toBe(true);
			expect(report.results.some((r) => r.module === 'skeleton' && r.status === 'ok')).toBe(true);
		} finally {
			rmSync(dir, { recursive: true, force: true });
		}
	});
});
