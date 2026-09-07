import { describe, expect, it } from 'vitest';
import { cpSync, copyFileSync, mkdirSync, readFileSync, symlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tempProject, ROOT } from './helpers';
import { checkStructuralDuplicates } from '../packages/svforge/src/structural-duplication';
import { checkDesignSystem } from '../packages/svforge/src/design-system';

describe('structural component duplication (#353)', () => {
	it('warns with structural evidence when a renamed, lightly rearranged catalog component is copied', () => {
		const project = tempProject('sf-structural-duplicate');
		try {
			const components = join(project.dir, 'src/lib/components/svforge');
			mkdirSync(join(components, 'ui'), { recursive: true });
			const card = readFileSync(
				join(ROOT, 'packages/svforge/templates/base/src/lib/components/svforge/ui/Card.svelte'),
				'utf-8'
			);
			writeFileSync(join(components, 'ui/Card.svelte'), card);
			writeFileSync(
				join(project.dir, 'src/lib/components/ProfilePanel.svelte'),
				card.replace('border-b border-surface-200-800 pb-3', 'pb-3 border-surface-200-800 border-b')
			);

			const findings = checkStructuralDuplicates(project.dir);
			expect(findings).toEqual([
				expect.objectContaining({
					component: 'Card',
					severity: 'warn',
					file: 'src/lib/components/ProfilePanel.svelte',
					evidence: expect.arrayContaining([expect.stringContaining('elements')])
				})
			]);
		} finally {
			project.cleanup();
		}
	});

	it('only reports structural matches through checkDesignSystem when explicitly opted in', async () => {
		const project = tempProject('sf-structural-opt-in');
		try {
			const ui = join(project.dir, 'src/lib/components/svforge/ui');
			mkdirSync(ui, { recursive: true });
			const card = readFileSync(join(ROOT, 'packages/svforge/templates/base/src/lib/components/svforge/ui/Card.svelte'), 'utf-8');
			writeFileSync(join(project.dir, 'package.json'), JSON.stringify({ dependencies: {} }));
			writeFileSync(join(ui, 'Card.svelte'), card);
			mkdirSync(join(project.dir, 'src/lib/components'), { recursive: true });
			writeFileSync(join(project.dir, 'src/lib/components/Panel.svelte'), card);
			expect((await checkDesignSystem(project.dir)).some((result) => result.message.includes('structurally duplicates'))).toBe(false);
			expect((await checkDesignSystem(project.dir, { experimentalStructuralDuplication: true })).some((result) => result.message.includes('structurally duplicates Card'))).toBe(true);
		} finally {
			project.cleanup();
		}
	});

	it('delivers the same opt-in warning through the scaffolded checker', async () => {
		const { execFileSync } = await import('node:child_process');
		const project = tempProject('sf-structural-checker');
		try {
			const ui = join(project.dir, 'src/lib/components/svforge/ui');
			mkdirSync(ui, { recursive: true });
			const card = readFileSync(join(ROOT, 'packages/svforge/templates/base/src/lib/components/svforge/ui/Card.svelte'), 'utf-8');
			writeFileSync(join(project.dir, 'package.json'), JSON.stringify({ dependencies: {} }));
			symlinkSync(join(ROOT, 'node_modules'), join(project.dir, 'node_modules'), 'dir');
			writeFileSync(join(project.dir, 'svforge-catalog.json'), JSON.stringify({ designSystem: { ui: { Card: { path: 'ui/Card.svelte' } } } }));
			writeFileSync(join(ui, 'Card.svelte'), card);
			mkdirSync(join(project.dir, 'src/lib/components'), { recursive: true });
			writeFileSync(join(project.dir, 'src/lib/components/Panel.svelte'), card);
			copyFileSync(join(ROOT, 'packages/svforge/templates/base/root/svforge-check.mjs'), join(project.dir, 'svforge-check.mjs'));
			const output = execFileSync('node', ['svforge-check.mjs'], {
				cwd: project.dir,
				env: { ...process.env, SVFORGE_EXPERIMENTAL_STRUCTURAL_DUPLICATION: '1' }
			}).toString();
			expect(output).toContain('structurally duplicates Card');
		} finally {
			project.cleanup();
		}
	});

	it('keeps an ordinary layout below the experimental threshold', () => {
		const project = tempProject('sf-structural-layout');
		try {
			mkdirSync(join(project.dir, 'src/lib/components/svforge/ui'), { recursive: true });
			cpSync(
				join(ROOT, 'packages/svforge/templates/base/src/lib/components/svforge/ui/Card.svelte'),
				join(project.dir, 'src/lib/components/svforge/ui/Card.svelte')
			);
			writeFileSync(
				join(project.dir, 'src/lib/components/Hero.svelte'),
				'<section class="mx-auto grid max-w-7xl gap-6 p-6"><h1>Welcome</h1><p>Start here.</p><a class="btn preset-filled-primary-500" href="/start">Start</a></section>'
			);
			expect(checkStructuralDuplicates(project.dir)).toEqual([]);
		} finally {
			project.cleanup();
		}
	});
});
