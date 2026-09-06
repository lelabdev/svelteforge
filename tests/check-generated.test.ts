import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const { assertNoDrift, checkGenerated, discoverPrebuildPackages, FIX_COMMAND } = await import('../scripts/check-generated.mjs');

const ROOT = process.cwd();

function git(root: string, ...args: string[]) {
	execFileSync('git', ['-C', root, ...args], { stdio: 'pipe' });
}

/** Full isolated workspace: a real git repo with one prebuild package. */
function makeWorkspace() {
	const root = mkdtempSync(join(tmpdir(), 'svforge-gate-e2e-'));
	const pkgDir = join(root, 'packages', 'demo');
	mkdirSync(join(pkgDir, 'templates'), { recursive: true });
	mkdirSync(join(pkgDir, 'src'), { recursive: true });
	writeFileSync(join(pkgDir, 'package.json'), JSON.stringify({
		name: 'demo',
		scripts: { prebuild: 'node ./prebuild.mjs' }
	}));
	// Prebuild copies templates/input.txt into src/generated.txt (deterministic).
	writeFileSync(join(pkgDir, 'prebuild.mjs'), `
		import { copyFileSync } from 'node:fs';
		copyFileSync(new URL('./templates/input.txt', import.meta.url), new URL('./src/generated.txt', import.meta.url));
	`);
	writeFileSync(join(pkgDir, 'templates', 'input.txt'), 'v1\n');
	// The committed state already contains the generated artifact, as a real
	// repo would after a first build.
	writeFileSync(join(pkgDir, 'src', 'generated.txt'), 'v1\n');
	git(root, 'init');
	git(root, 'config', 'user.email', 'test@test');
	git(root, 'config', 'user.name', 'test');
	git(root, 'add', '-A');
	git(root, 'commit', '-m', 'init');
	return root;
}

/** Complete SpawnSyncReturns-shaped result for git test doubles (#359 review). */
const gitResult = (stdout: string) => ({ status: 0, stdout, stderr: '', pid: 4321, output: [stdout], signal: null });

describe('generated-manifest freshness gate (#329)', () => {
	it('discovers every prebuild package, including the previously omitted modules', () => {
		const packages = discoverPrebuildPackages();
		const directories = packages.map((pkg: { name: string; directory: string }) => pkg.directory);

		expect(directories).toHaveLength(14);
		for (const previouslyOmitted of ['realtime', 'audit', 'notifications', 'jobs', 'chat']) {
			expect(directories).toContain(`packages/${previouslyOmitted}`);
		}
	});

	it('passes on a clean tree', () => {
		const git = () => gitResult('');

		expect(assertNoDrift(ROOT, git)).toEqual([]);
	});

	it('fails with the drift, the regeneration command, and no unsafe staging advice', () => {
		const git = () => gitResult(' M packages/audit/src/templates.ts\n?? packages/svforge/src/generated-root-file.ts\n');

		expect(() => assertNoDrift(ROOT, git)).toThrow(/Stale generated files committed/);
		expect(() => assertNoDrift(ROOT, git)).toThrow(/packages\/audit\/src\/templates\.ts/);
		expect(() => assertNoDrift(ROOT, git)).toThrow(new RegExp(FIX_COMMAND.replace(/[*.'()]/g, '\\$&')));
		// The advertised fix must not blind-commit unrelated changes (#358 review).
		expect(() => assertNoDrift(ROOT, git)).not.toThrow(/commit -am/);
	});

	it('full gate: runs prebuilds and passes a committed, fresh workspace', () => {
		const root = makeWorkspace();
		try {
			const packages = checkGenerated(root);
			expect(packages.map((pkg) => pkg.directory)).toContain('packages/demo');
			expect(readFileSync(join(root, 'packages/demo/src/generated.txt'), 'utf8')).toBe('v1\n');
		} finally {
			rmSync(root, { recursive: true, force: true });
		}
	});

	it('full gate: a changed template without a committed regeneration fails with a diff (#329)', () => {
		const root = makeWorkspace();
		try {
			checkGenerated(root);
			// Template changes but nothing regenerates or commits it.
			writeFileSync(join(root, 'packages/demo/templates/input.txt'), 'v2\n');
			git(root, 'add', '-A');
			git(root, 'commit', '-m', 'stale template change');
			expect(() => checkGenerated(root)).toThrow(/Stale generated files committed[\s\S]*generated\.txt/);
		} finally {
			rmSync(root, { recursive: true, force: true });
		}
	});

	it('full gate: two consecutive prebuilds produce a stable result (#329)', () => {
		const root = makeWorkspace();
		try {
			expect(() => checkGenerated(root)).not.toThrow();
			expect(() => checkGenerated(root)).not.toThrow();
		} finally {
			rmSync(root, { recursive: true, force: true });
		}
	});

	it('full gate: a newly added prebuild workspace is discovered automatically (#329)', () => {
		const root = makeWorkspace();
		try {
			const otherDir = join(root, 'packages', 'other');
			mkdirSync(join(otherDir, 'templates'), { recursive: true });
			mkdirSync(join(otherDir, 'src'), { recursive: true });
			writeFileSync(join(otherDir, 'package.json'), JSON.stringify({
				name: 'other',
				scripts: { prebuild: 'node ./prebuild.mjs' }
			}));
			writeFileSync(join(otherDir, 'prebuild.mjs'), `
				import { writeFileSync } from 'node:fs';
				writeFileSync(new URL('./src/generated.txt', import.meta.url), 'other\\n');
			`);
			writeFileSync(join(otherDir, 'templates', 'input.txt'), 'x\n');
			// Commit the already-generated state, as a real repo would.
			execFileSync('bun', ['run', 'prebuild'], { cwd: otherDir, stdio: 'pipe' });
			git(root, 'add', '-A');
			git(root, 'commit', '-m', 'add other package');

			checkGenerated(root);
			expect(readFileSync(join(otherDir, 'src/generated.txt'), 'utf8')).toBe('other\n');
		} finally {
			rmSync(root, { recursive: true, force: true });
		}
	});
});
