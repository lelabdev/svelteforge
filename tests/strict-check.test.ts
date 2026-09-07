import { describe, it, expect } from 'vitest';
import { existsSync, mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { baseRootFiles } from '../packages/svforge/src/templates';
import { applyBaseMode } from '../packages/svforge/src/modes/base';
import { ROOT } from './helpers';

function warningProject(): string {
	const project = mkdtempSync(join(tmpdir(), 'sf-strict-check-'));
	writeFileSync(join(project, 'package.json'), JSON.stringify({ name: 'probe' }));
	mkdirSync(join(project, 'src'), { recursive: true });
	writeFileSync(join(project, 'src', 'Warning.svelte'), '<div class="p-[13px]">warning</div>');
	writeFileSync(join(project, 'svforge-check.mjs'), baseRootFiles['/svforge-check.mjs']);
	return project;
}

function run(project: string, command: string, args: string[] = []) {
	return spawnSync(process.execPath, [command, ...args], { cwd: project, encoding: 'utf-8' });
}

function runCommand(project: string, command: string, args: string[]) {
	const result = spawnSync(command, args, { cwd: project, encoding: 'utf-8' });
	if (result.error) throw result.error;
	return result;
}

function expectSuccess(project: string, command: string, args: string[]) {
	const result = runCommand(project, command, args);
	expect(result.status, result.stderr).toBe(0);
	return result;
}

describe('strict design-system checks (#344)', () => {
	it('keeps WARN advisory normally but makes them block in strict mode for packaged and generated checkers', () => {
		const project = warningProject();
		try {
			for (const command of ['svforge-check.mjs', join(ROOT, 'packages/svforge/bin/svforge.mjs')]) {
				const args = command.endsWith('svforge.mjs') ? ['check'] : [];
				const normal = run(project, command, args);
				const strict = run(project, command, [...args, '--strict']);

				expect(normal.status).toBe(0);
				expect(normal.stdout).toContain('WARN');
				expect(strict.status).toBe(1);
			}
		} finally {
			rmSync(project, { recursive: true, force: true });
		}
	});

	it('installs Lefthook only after Git is initialized and blocks a real commit', () => {
		const parent = mkdtempSync(join(tmpdir(), 'sf-lefthook-integration-'));
		const project = join(parent, 'app');
		const sv = join(ROOT, 'node_modules/.bin/sv');
		const addon = `file:${join(ROOT, 'packages/svforge')}=template:base+testing:vitest+hooks:lefthook`;
		try {
			// Build the local file: addon so `sv add` exercises exactly what a
			// consumer receives, including its package lifecycle script.
			expectSuccess(join(ROOT, 'packages/svforge'), 'bun', ['run', 'build']);
			expectSuccess(parent, sv, [
				'create',
				'app',
				'--template',
				'minimal',
				'--types',
				'ts',
				'--no-install',
				'--no-add-ons',
				'--no-download-check'
			]);

			// A freshly created project is not a Git repository. `--install bun`
			// must still succeed; prepare intentionally does nothing in this case.
			expectSuccess(project, sv, ['add', addon, '--install', 'bun', '--no-download-check']);
			expect(existsSync(join(project, '.git'))).toBe(false);

			expectSuccess(project, 'git', ['init']);
			expectSuccess(project, 'bun', ['install']);
			expect(existsSync(join(project, '.git/hooks/pre-commit'))).toBe(true);
			expectSuccess(project, 'git', ['config', 'user.email', 'tests@example.com']);
			expectSuccess(project, 'git', ['config', 'user.name', 'SvelteForge tests']);
			writeFileSync(join(project, 'src', 'Warning.svelte'), '<div class="p-[13px]">warning</div>');
			expectSuccess(project, 'git', ['add', 'src/Warning.svelte']);

			const commit = runCommand(project, 'git', ['commit', '-m', 'strict hook must block']);
			expect(commit.status).not.toBe(0);
			expect(`${commit.stdout}\n${commit.stderr}`).toContain('WARN');
		} finally {
			rmSync(parent, { recursive: true, force: true });
		}
	}, 120_000);

	it('adds an opt-in Lefthook adapter that blocks the same warning', () => {
		const files = new Map<string, (content: string) => string>();
		const dependencies: string[] = [];
		applyBaseMode(
			{
				dependency: () => {},
				devDependency: (name: string) => dependencies.push(name),
				file: (path: string, transform: (content: string) => string) => files.set(path, transform)
			} as never,
			{},
			{},
			'lefthook'
		);
		const project = warningProject();
		try {
			const config = files.get('.lefthook.yml')!('');
			expect(dependencies).toContain('lefthook');
			expect(config).toContain("glob: '*.{svelte,html,css,json}'");
			const hookCommand = config.match(/run: (.+)/)?.[1];
			expect(hookCommand).toBe('node svforge-check.mjs --strict');
			const [binary, checker, flag] = hookCommand!.split(' ');
			const result = spawnSync(binary, [checker, flag], { cwd: project, encoding: 'utf-8' });
			expect(result.status).toBe(1);
		} finally {
			rmSync(project, { recursive: true, force: true });
		}
	});
});
