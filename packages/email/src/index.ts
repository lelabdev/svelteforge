import { defineAddon, defineAddonOptions } from 'sv';
import { files } from './templates';

/**
 * Enrich the project's .svforge.json AI manifest (#234) without overwriting
 * user edits. Small inline helper — modules are standalone packages.
 */
function enrichManifest(content: string, moduleId: string, capability: string, pattern: string): string {
	let manifest: { template: string; modules: string[]; capabilities: string[]; patterns: Record<string, string> } = {
		template: 'base',
		modules: [],
		capabilities: [],
		patterns: {}
	};
	try {
		manifest = content && content.trim() ? JSON.parse(content) : manifest;
	} catch {
		manifest = { template: 'base', modules: [], capabilities: [], patterns: {} };
	}
	if (!Array.isArray(manifest.modules)) manifest.modules = [];
	if (!Array.isArray(manifest.capabilities)) manifest.capabilities = [];
	if (!manifest.patterns) manifest.patterns = {};
	// Full manifest contract (#296): .svforge.json must carry the same
	// module + capability + pattern data as llms.txt, immediately after sv add.
	if (!manifest.modules.includes(moduleId)) manifest.modules.push(moduleId);
	if (!manifest.capabilities.includes(capability)) manifest.capabilities.push(capability);
	manifest.patterns[capability] = pattern;
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
		// Append at the END of the Capabilities section (before the next
		// "## " header): module order then matches installation order, so
		// `svforge context` regenerates a byte-identical llms.txt (#296).
		let insertAt = lines.length;
		const header = lines.findIndex((l) => l === '## Capabilities installed');
		if (header >= 0) {
			const nextSection = lines.findIndex((l, i) => i > header && l.startsWith('## '));
			insertAt = nextSection >= 0 ? nextSection : lines.length;
			// insert BEFORE the blank line that closes the section, so the
			// byte layout matches renderLlmstxt exactly (#296)
			if (insertAt > header + 1 && lines[insertAt - 1] === '') insertAt -= 1;
		}
		lines.splice(insertAt, 0, capLine);
	}
	const patLine = `- ${capability}: ${pattern}`;
	if (!lines.some((l) => l === patLine)) {
		let insertAt = lines.length;
		const header = lines.findIndex((l) => l === '## Canonical patterns');
		if (header >= 0) {
			const nextSection = lines.findIndex((l, i) => i > header && l.startsWith('## '));
			insertAt = nextSection >= 0 ? nextSection : lines.length;
			if (insertAt > header + 1 && lines[insertAt - 1] === '') insertAt -= 1;
		}
		lines.splice(insertAt, 0, patLine);
	}
	return lines.join('\n');
}


export default defineAddon({
	id: 'svforge-email',
	alias: 'forge-email',
	shortDescription: 'SVForge Email — transactional emails via Resend',
	homepage: 'https://github.com/lelabdev/svelteforge',
	// Empty options required: sv >= 0.15 crashes on addons without an
	// options object (Object.entries(undefined) in promptAddonQuestions).
	options: defineAddonOptions().build(),
	setup: ({ unsupported, isKit }) => {
		if (!isKit) unsupported('SVForge Email requires SvelteKit');
	},
	run: ({ sv }) => {
		sv.dependency('resend', '^6.20.0');
		for (const [path, content] of Object.entries(files)) {
			sv.file(`src${path}`, () => content);
		}
		// AI context (#234): declare this module in .svforge.json.
		sv.file('.svforge.json', (content) => enrichManifest(content, 'email', 'email (Resend)', 'src/lib/server/email.ts'));
		sv.file('llms.txt', (content) => mergeLlmstxt(content, 'email (Resend)', 'src/lib/server/email.ts'));
	},
	nextSteps: () => [
		'@svforge/email installed!',
		'Add RESEND_API_KEY to your .env',
		'Usage: import { sendEmail } from "$lib/server/email"',
		'  await sendEmail({ to: "user@example.com", subject: "Welcome", html: "<h1>Welcome!</h1>" });'
	]
});
