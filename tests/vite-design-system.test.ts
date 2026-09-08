import { afterEach, describe, expect, it } from 'vitest';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';
import { baseRootFiles } from '../packages/svforge/src/templates';

const DESIGN_SYSTEM_ROOT_FILES = ['/svforge-check.mjs', '/svforge-design-system-vite-plugin.mjs'] as const;

function project(): string {
	const root = mkdtempSync(join(tmpdir(), 'sf-vite-design-system-'));
	writeFileSync(join(root, 'package.json'), JSON.stringify({ name: 'probe' }));
	for (const file of DESIGN_SYSTEM_ROOT_FILES) {
		writeFileSync(join(root, file), baseRootFiles[file]);
	}
	mkdirSync(join(root, 'src/lib/components/svforge/primitives'), { recursive: true });
	writeFileSync(join(root, 'src/lib/components/svforge/primitives/Button.svelte'), '<button>OK</button>');
	return root;
}

async function vitePlugin(root: string) {
	const plugin = await import(`${pathToFileURL(join(root, 'svforge-design-system-vite-plugin.mjs')).href}?${Date.now()}`);
	return plugin.svforgeDesignSystemPlugin({ root });
}

async function checker(root: string) {
	return import(`${pathToFileURL(join(root, 'svforge-check.mjs')).href}?${Date.now()}`);
}

describe('Vite design-system build gate (#350)', () => {
	const projects: string[] = [];
	afterEach(() => projects.splice(0).forEach((root) => rmSync(root, { recursive: true, force: true })));

	it('allows a clean production build', async () => {
		const root = project();
		projects.push(root);
		const plugin = await vitePlugin(root);
		expect(() => plugin.buildStart()).not.toThrow();
	});

	it('fails a production build when an AI-generated local component duplicates Skeleton', async () => {
		const root = project();
		projects.push(root);
		mkdirSync(join(root, 'src/lib/features/ai'), { recursive: true });
		writeFileSync(join(root, 'src/lib/features/ai/Dialog.svelte'), '<div>duplicate</div>');

		const plugin = await vitePlugin(root);
		await expect(plugin.buildStart()).rejects.toThrow(/Duplicated Skeleton primitive "Dialog".*@skeletonlabs\/skeleton-svelte/);
	});

	it('shares the checker diagnostics with the Vite hook', async () => {
		const root = project();
		projects.push(root);
		mkdirSync(join(root, 'src/lib/features/ai'), { recursive: true });
		writeFileSync(join(root, 'src/lib/features/ai/Dialog.svelte'), '<div>duplicate</div>');

		const diagnostic = (await (await checker(root)).checkDesignSystem(root)).find((result: { status: string }) => result.status === 'error');
		const plugin = await vitePlugin(root);
		await expect(plugin.buildStart()).rejects.toThrow(diagnostic?.msg);
	});

	it('keeps WARN diagnostics non-blocking unless strict mode is requested', async () => {
		const root = project();
		projects.push(root);
		mkdirSync(join(root, 'src/lib/features/ai'), { recursive: true });
		writeFileSync(join(root, 'src/lib/features/ai/Notice.svelte'), '<div class="p-[13px]">notice</div>');

		const plugin = await vitePlugin(root);
		await expect(plugin.buildStart()).resolves.toBeUndefined();
		const strictPlugin = (await import(`${pathToFileURL(join(root, 'svforge-design-system-vite-plugin.mjs')).href}?strict`))
			.svforgeDesignSystemPlugin({ root, strict: true });
		await expect(strictPlugin.buildStart()).rejects.toThrow(/Arbitrary radius\/spacing/);
	});
});
