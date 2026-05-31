import { describe, it, expect } from 'vitest';
import { existsSync } from 'fs';
import { join } from 'path';

const ROOT = join(import.meta.dirname, '..');

describe('ui_toast module', () => {
	const dir = join(ROOT, 'packages/ui_toast');

	it('has Toaster component', () => {
		expect(existsSync(join(dir, 'templates/src/src/lib/components/svforge/ui/Toaster.svelte'))).toBe(true);
	});

	it('has toaster utility', () => {
		expect(existsSync(join(dir, 'templates/src/src/lib/components/svforge/ui/toaster.ts'))).toBe(true);
	});

	it('has dist built', () => {
		expect(existsSync(join(dir, 'dist/index.js'))).toBe(true);
	});
});

describe('dnd module', () => {
	const dir = join(ROOT, 'packages/dnd');

	it('has SortableList component', () => {
		expect(existsSync(join(dir, 'templates/src/src/lib/components/svforge/dnd/SortableList.svelte'))).toBe(true);
	});

	it('has dist built', () => {
		expect(existsSync(join(dir, 'dist/index.js'))).toBe(true);
	});
});

describe('tiptap module', () => {
	const dir = join(ROOT, 'packages/tiptap');

	it('has TiptapEditor component', () => {
		expect(existsSync(join(dir, 'templates/src/lib/components/svforge/tiptap/TiptapEditor.svelte'))).toBe(true);
	});

	it('has TiptapPreview component', () => {
		expect(existsSync(join(dir, 'templates/src/lib/components/svforge/tiptap/TiptapPreview.svelte'))).toBe(true);
	});

	it('has TiptapToolbar component', () => {
		expect(existsSync(join(dir, 'templates/src/lib/components/svforge/tiptap/TiptapToolbar.svelte'))).toBe(true);
	});

	it('has extensions', () => {
		expect(existsSync(join(dir, 'templates/src/lib/components/svforge/tiptap/tiptap-extensions.ts'))).toBe(true);
	});

	it('has dist built', () => {
		expect(existsSync(join(dir, 'dist/index.js'))).toBe(true);
	});
});
