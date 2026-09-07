import { describe, it, expect } from 'vitest';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
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
