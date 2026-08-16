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
	id: 'svforge-notifications',
	alias: 'forge-notifications',
	shortDescription: 'SVForge Notifications — persistent business notifications (read/unread)',
	homepage: 'https://github.com/lelabdev/svelteforge',
	options: defineAddonOptions().build(),

	setup: ({ unsupported, isKit }) => {
		if (!isKit) unsupported('SVForge Notifications requires SvelteKit');
	},

	run: ({ sv, cancel, cwd }) => {
		// notifications/index.ts imports $lib/server/db — requires dashboard.
		if (!existsSync(join(cwd, 'src/lib/server/db/index.ts'))) {
			cancel('SVForge Notifications requires the svforge dashboard template (src/lib/server/db missing — run `sv add svforge=template:dashboard` first)');
			return;
		}

		for (const [path, content] of Object.entries(files)) {
			sv.file(`src${path}`, () => content);
		}

		// Register the schema in the Drizzle barrel.
		sv.file('src/lib/server/db/schema.ts', (content) => {
			if (!content || content.includes('notifications')) return content;
			return `import { notifications } from '$lib/server/notifications/schema';\n${content}\nexport { notifications };\n`;
		});

		// Paraglide messages (#239).
		sv.file('messages/fr.json', (content) =>
			mergeMessages(content, {
				notif_title: 'Notifications',
				notif_bell: 'Notifications',
				notif_mark_all: 'Tout marquer comme lu',
				notif_empty: 'Aucune notification.'
			})
		);
		sv.file('messages/en.json', (content) =>
			mergeMessages(content, {
				notif_title: 'Notifications',
				notif_bell: 'Notifications',
				notif_mark_all: 'Mark all as read',
				notif_empty: 'No notifications.'
			})
		);

		// AI context (#234).
		sv.file('.svforge.json', (content) => enrichManifest(content, 'notifications'));
	},

	nextSteps: () => [
		'@svforge/notifications installed!',
		'Create: import { notificationsApi } from "$lib/server/notifications";',
		'  await notificationsApi.create({ userId, type: "export.ready", title, message, actionUrl });',
		'UI: add <NotificationsBell /> to your navbar (load items in +layout.server.ts)',
		'Optional realtime: publish { channel: `user:${userId}`, event: "notification.created" } after create'
	]
});
