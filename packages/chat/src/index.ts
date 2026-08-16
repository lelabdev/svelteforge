import { defineAddon, defineAddonOptions } from 'sv';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { files } from './templates';

/**
 * Enrich the project's .svforge.json AI manifest (#234) without overwriting
 * user edits. Small inline helper — modules are standalone packages.
 */
function enrichManifest(content: string, moduleId: string): string {
	let manifest: { template: string; modules: string[] } = { template: 'base', modules: [] };
	try {
		manifest = content && content.trim() ? JSON.parse(content) : manifest;
	} catch {
		manifest = { template: 'base', modules: [] };
	}
	if (!manifest.modules.includes(moduleId)) manifest.modules.push(moduleId);
	return `${JSON.stringify(manifest, null, 2)}\n`;
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
		sv.file('.svforge.json', (content) => enrichManifest(content, 'chat'));
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
