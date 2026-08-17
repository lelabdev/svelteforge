import { defineAddon, defineAddonOptions } from 'sv';
import { files } from './templates';

/**
 * Merge Paraglide catalog entries into an existing messages/{locale}.json
 * (#239). Never overwrites existing keys.
 */
function mergeMessages(content: string, additions: Record<string, string>): string {
	let catalog: Record<string, unknown> = {};
	if (content && content.trim()) {
		try {
			catalog = JSON.parse(content);
		} catch {
			catalog = {};
		}
	}
	for (const [key, value] of Object.entries(additions)) {
		catalog[key] = value;
	}
	return `${JSON.stringify(catalog, null, 2)}\n`;
}

/**
 * Enrich the project's .svforge.json AI manifest (#234) without overwriting
 * user edits. Small inline helper — modules are standalone packages.
 */
function enrichManifest(content, moduleId) {
	let manifest = { template: 'base', modules: [] };
	try {
		manifest = content && content.trim() ? JSON.parse(content) : manifest;
	} catch {
		manifest = { template: 'base', modules: [] };
	}
	if (!manifest.modules.includes(moduleId)) manifest.modules.push(moduleId);
	return `${JSON.stringify(manifest, null, 2)}\n`;
}

/**
 * Merge this module's capability + canonical pattern into the scaffolded
 * llms.txt (#258/#284) so the AI context reflects every installed module
 * even though svforge itself is not installed in the generated project.
 */
function mergeLlmstxt(content: string, capability: string, pattern: string): string {
	const lines = (content || '').split('\n');
	const capLine = `- ${capability}`;
	if (!lines.some((l) => l === capLine)) {
		const idx = lines.findIndex((l) => l === '## Capabilities installed');
		if (idx >= 0) lines.splice(idx + 1, 0, capLine);
	}
	const patLine = `- ${capability}: ${pattern}`;
	if (!lines.some((l) => l === patLine)) {
		const idx = lines.findIndex((l) => l === '## Canonical patterns');
		if (idx >= 0) lines.splice(idx + 1, 0, patLine);
	}
	return lines.join('\n');
}


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
		sv.dependency('@tiptap/core', '^3.30.1');
		sv.dependency('@tiptap/starter-kit', '^3.30.1');
		sv.dependency('@tiptap/extension-underline', '^3.30.1');
		sv.dependency('@tiptap/extension-link', '^3.30.1');

		for (const [path, content] of Object.entries(files)) {
			sv.file(`src${path}`, () => content);
		}

		// Paraglide messages (#239): toolbar copy merged FR/EN without
		// overwriting existing project keys.
		sv.file('messages/fr.json', (content) =>
			mergeMessages(content, {
				tiptap_bold: 'Gras',
				tiptap_italic: 'Italique',
				tiptap_underline: 'Souligné',
				tiptap_strikethrough: 'Barré',
				tiptap_blockquote: 'Citation',
				tiptap_code_block: 'Bloc de code',
				tiptap_bullet_list: 'Liste à puces',
				tiptap_ordered_list: 'Liste numérotée',
				tiptap_heading: 'Titre {level}',
				tiptap_link: 'Lien',
				tiptap_insert_link: 'Insérer un lien',
				tiptap_loading: 'Chargement…'
			})
		);
		sv.file('messages/en.json', (content) =>
			mergeMessages(content, {
				tiptap_bold: 'Bold',
				tiptap_italic: 'Italic',
				tiptap_underline: 'Underline',
				tiptap_strikethrough: 'Strikethrough',
				tiptap_blockquote: 'Blockquote',
				tiptap_code_block: 'Code block',
				tiptap_bullet_list: 'Bullet list',
				tiptap_ordered_list: 'Ordered list',
				tiptap_heading: 'Heading {level}',
				tiptap_link: 'Link',
				tiptap_insert_link: 'Insert link',
				tiptap_loading: 'Loading…'
			})
		);

		// AI context (#234): declare this module in .svforge.json.
		sv.file('.svforge.json', (content) => enrichManifest(content, 'tiptap'));
		sv.file('llms.txt', (content) => mergeLlmstxt(content, 'rich text (Tiptap)', 'src/lib/components/svforge/tiptap/'));
	},

	nextSteps: () => [
		'@svforge/tiptap installed!',
		'Usage:',
		"  import { TiptapEditor, TiptapPreview } from '$lib/components/svforge/tiptap';",
		'  <TiptapEditor content={content} onUpdate={(json) => content = json} />',
		'  <TiptapPreview content={content} />'
	]
});
