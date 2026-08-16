import { defineAddon, defineAddonOptions } from 'sv';
import { files } from './templates';

export default defineAddon({
	id: 'svforge-tiptap',
	alias: 'forge-tiptap',
	shortDescription: 'SVForge Tiptap — rich text editor',
	homepage: 'https://github.com/lelabdev/svelteforge',
	// Empty options required: sv >= 0.15 crashes on addons without an
	// options object (Object.entries(undefined) in promptAddonQuestions).
	options: defineAddonOptions().build(),

	setup: ({ unsupported, isKit }) => {
		if (!isKit) unsupported('SVForge Tiptap requires SvelteKit');
	},

	run: ({ sv }) => {
		sv.dependency('@tiptap/core', 'latest');
		sv.dependency('@tiptap/starter-kit', 'latest');
		sv.dependency('@tiptap/extension-underline', 'latest');
		sv.dependency('@tiptap/extension-link', 'latest');

		for (const [path, content] of Object.entries(files)) {
			sv.file(`src${path}`, () => content);
		}
	},

	nextSteps: () => [
		'@svforge/tiptap installed!',
		'Usage:',
		"  import { TiptapEditor, TiptapPreview } from '$lib/components/svforge/tiptap';",
		'  <TiptapEditor content={content} onUpdate={(json) => content = json} />',
		'  <TiptapPreview content={content} />'
	]
});
