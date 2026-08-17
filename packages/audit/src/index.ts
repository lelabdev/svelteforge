import { defineAddon, defineAddonOptions } from 'sv';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { files } from './templates';

/**
 * Enrich the project's .svforge.json AI manifest (#234) without overwriting
 * user edits — module id, capability and canonical pattern are merged
 * idempotently (#258). Small inline helper — modules are standalone packages.
 */
function enrichManifest(content: string, moduleId: string, capability: string, pattern: string): string {
	let manifest: {
		template: string;
		modules: string[];
		capabilities: string[];
		patterns: Record<string, string>;
	} = { template: 'base', modules: [], capabilities: [], patterns: {} };
	try {
		manifest = content && content.trim() ? JSON.parse(content) : manifest;
	} catch {
		manifest = { template: 'base', modules: [], capabilities: [], patterns: {} };
	}
	if (!Array.isArray(manifest.modules)) manifest.modules = [];
	if (!Array.isArray(manifest.capabilities)) manifest.capabilities = [];
	if (!manifest.patterns) manifest.patterns = {};
	if (!manifest.modules.includes(moduleId)) manifest.modules.push(moduleId);
	if (!manifest.capabilities.includes(capability)) manifest.capabilities.push(capability);
	if (!manifest.patterns[capability]) manifest.patterns[capability] = pattern;
	return `${JSON.stringify(manifest, null, 2)}\n`;
}

/**
 * Merge this module's capability + canonical pattern into the scaffolded
 * llms.txt (#258) so the AI context reflects every installed module even
 * though svforge itself is not installed in the generated project.
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
		// NEVER overwrite an existing key (#296): a consumer may have
		// customized a translation, and recomposition/reinstall must not
		// clobber it.
		if (!(key in catalog)) catalog[key] = value;
	}
	return `${JSON.stringify(catalog, null, 2)}\n`;
}

export default defineAddon({
	id: 'svforge-audit',
	alias: 'forge-audit',
	shortDescription: 'SVForge Audit — business action audit trail (append-only)',
	homepage: 'https://github.com/lelabdev/svelteforge',
	options: defineAddonOptions().build(),

	setup: ({ unsupported, isKit }) => {
		if (!isKit) unsupported('SVForge Audit requires SvelteKit');
	},

	run: ({ sv, cancel, cwd }) => {
		// audit/index.ts imports $lib/server/db — provided only by the svforge
		// dashboard template (Drizzle). Checked in run() so `sv add
		// svforge=template:dashboard audit` in ONE call works (setup() of all
		// addons runs before any run()).
		if (!existsSync(join(cwd, 'src/lib/server/db/index.ts'))) {
			cancel('SVForge Audit requires the svforge dashboard template (src/lib/server/db missing — run `sv add svforge=template:dashboard` first)');
			return;
		}

		for (const [path, content] of Object.entries(files)) {
			sv.file(`src${path}`, () => content);
		}

		// Audit schema must be registered in the Drizzle schema barrel.
		sv.file('src/lib/server/db/schema.ts', (content) => {
			if (!content || content.includes('audit')) return content;
			return `import { auditLogs } from '$lib/server/audit/schema';\n${content}\nexport { auditLogs };\n`;
		});

		// Paraglide messages (#239): audit UI copy merged FR/EN.
		sv.file('messages/fr.json', (content) =>
			mergeMessages(content, {
				audit_title: 'Journal d’audit',
				audit_subtitle: 'Qui a fait quoi, sur quelle entité, quand.',
				audit_action: 'Action',
				audit_entity: 'Entité',
				audit_when: 'Quand',
				audit_actor: 'Acteur',
				audit_empty: 'Aucune entrée d’audit.',
				common_filter: 'Filtrer',
				common_previous: 'Précédent',
				common_next: 'Suivant'
			})
		);
		sv.file('messages/en.json', (content) =>
			mergeMessages(content, {
				audit_title: 'Audit log',
				audit_subtitle: 'Who did what, on which entity, when.',
				audit_action: 'Action',
				audit_entity: 'Entity',
				audit_when: 'When',
				audit_actor: 'Actor',
				audit_empty: 'No audit entries.',
				common_filter: 'Filter',
				common_previous: 'Previous',
				common_next: 'Next'
			})
		);

		// AI context (#234): declare this module in .svforge.json.
		sv.file('.svforge.json', (content) => enrichManifest(content, 'audit', 'audit trail', 'src/lib/server/audit/'));
		sv.file('llms.txt', (content) => mergeLlmstxt(content, 'audit trail', 'src/lib/server/audit/'));
	},

	nextSteps: () => [
		'@svforge/audit installed!',
		'Record: import { audit } from "$lib/server/audit";',
		'  await audit.record({ actorId: user.id, action: "punch.corrected", entityType: "punch", entityId: punch.id });',
		'Read: await audit.forEntity("punch", punchId); await audit.byActor(userId);',
		'Admin view: /admin/audit (pagination + filters)'
	]
});
