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

export default defineAddon({
	id: 'svforge-chat',
	alias: 'forge-chat',
	shortDescription: 'SVForge Chat — composable app chat (conversations, messages, read-state)',
	homepage: 'https://github.com/lelabdev/svelteforge',
	options: defineAddonOptions().build(),

	setup: ({ unsupported, isKit }) => {
		if (!isKit) unsupported('SVForge Chat requires SvelteKit');
	},

	run: ({ sv, cancel, cwd }) => {
		// chat/index.ts imports $lib/server/db — requires dashboard.
		if (!existsSync(join(cwd, 'src/lib/server/db/index.ts'))) {
			cancel('SVForge Chat requires the svforge dashboard template (src/lib/server/db missing — run `sv add svforge=template:dashboard` first)');
			return;
		}

		for (const [path, content] of Object.entries(files)) {
			sv.file(`src${path}`, () => content);
		}

		// Register the chat schemas in the Drizzle barrel.
		sv.file('src/lib/server/db/schema.ts', (content) => {
			if (!content || content.includes('conversationParticipants')) return content;
			return `import { conversations, conversationParticipants, messages as chatMessages, messageReads } from '$lib/server/chat/schema';\n${content}\nexport { conversations, conversationParticipants, chatMessages, messageReads };\n`;
		});

		// Paraglide messages (#239).
		sv.file('messages/fr.json', (content) =>
			mergeMessages(content, {
				chat_title: 'Messages',
				chat_conversation: 'Conversation',
				chat_empty: 'Aucun message pour le moment.',
				chat_no_messages: 'Aucun message',
				chat_message: 'Message',
				chat_placeholder: 'Écrivez votre message…',
				chat_send: 'Envoyer'
			})
		);
		sv.file('messages/en.json', (content) =>
			mergeMessages(content, {
				chat_title: 'Messages',
				chat_conversation: 'Conversation',
				chat_empty: 'No messages yet.',
				chat_no_messages: 'No messages',
				chat_message: 'Message',
				chat_placeholder: 'Write your message…',
				chat_send: 'Send'
			})
		);

		// AI context (#234).
		sv.file('.svforge.json', (content) => enrichManifest(content, 'chat', 'chat', 'src/lib/server/chat/'));
		sv.file('llms.txt', (content) => mergeLlmstxt(content, 'chat', 'src/lib/server/chat/'));
	},

	nextSteps: () => [
		'@svforge/chat installed!',
		'Routes: /chat (list) and /chat/[id] (conversation)',
		'API: import { chat } from "$lib/server/chat";',
		'  await chat.createConversation({ participantIds: [userA, userB] });',
		'  await chat.sendMessage({ conversationId, authorId: user.id, content: "Bonjour" });',
		'Optional: realtime → publish message.created on conversation:{id}',
		'  uploads → attachments, notifications → alert non-active participants'
	]
});
