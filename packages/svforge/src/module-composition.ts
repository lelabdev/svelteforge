/**
 * SvelteForge module composition & presets (#236).
 *
 * Formalizes the philosophy: 2 templates only (base/dashboard), opt-in
 * composable modules, and light presets (meta-packages) that compose existing
 * modules WITHOUT duplicating their code. Presets are recipes, not
 * implementations.
 */

export interface ModuleMeta {
	id: string;
	description: string;
	/** Template required to install this module. */
	requires: string[];
	/** Optional integrations that enhance the module (never forced). */
	optional: string[];
	/** Files/capabilities added (documentation + #234 manifest). */
	files: string[];
}

export interface Preset {
	description: string;
	/** Template the preset is built on. */
	requires: string;
	/** Modules installed by the preset (composition, not copies). */
	modules: string[];
	/** Recommended extras, never installed automatically. */
	optional: string[];
}

/** Contract for every svforge module (#236). */
export const MODULES: Record<string, ModuleMeta> = {
	ui_toast: {
		id: 'ui_toast',
		description: 'Toast notifications (Skeleton Toast)',
		requires: ['base'],
		optional: [],
		files: ['src/lib/components/svforge/ui/Toaster.svelte', 'src/lib/components/svforge/ui/toaster.ts']
	},
	dnd: {
		id: 'dnd',
		description: 'Drag & drop sortable lists',
		requires: ['base'],
		optional: [],
		files: ['src/lib/components/svforge/dnd/SortableList.svelte']
	},
	tiptap: {
		id: 'tiptap',
		description: 'Rich text editor (Tiptap, toolbar + preview)',
		requires: ['base'],
		optional: [],
		files: ['src/lib/components/svforge/tiptap/']
	},
	graph: {
		id: 'graph',
		description: 'Knowledge graph visualization (force-graph)',
		requires: ['base'],
		optional: [],
		files: ['src/lib/components/svforge/graph/']
	},
	email: {
		id: 'email',
		description: 'Transactional emails (Resend)',
		requires: ['base'],
		optional: [],
		files: ['src/lib/server/email.ts', 'src/lib/server/templates/']
	},
	oauth: {
		id: 'oauth',
		description: 'Social auth buttons (Google, GitHub)',
		requires: ['dashboard'],
		optional: [],
		files: ['src/lib/components/svforge/ui/OAuthButtons.svelte']
	},
	uploads: {
		id: 'uploads',
		description: 'File uploads (S3/R2, presigned, security test pack opt-in)',
		requires: ['base'],
		optional: ['testpack'],
		files: ['src/lib/components/svforge/uploads/', 'src/lib/server/s3.ts', 'src/routes/api/upload/']
	},
	blog: {
		id: 'blog',
		description: 'MDsveX blog (posts + list + detail)',
		requires: ['base'],
		optional: [],
		files: ['src/posts/', 'src/lib/utils/posts.ts', 'src/routes/blog/']
	},
	realtime: {
		id: 'realtime',
		description: 'WebSocket transport (publish/subscribe, channels isolés)',
		requires: ['base'],
		optional: [],
		files: ['src/lib/server/realtime/', 'src/lib/realtime/client.ts']
	},
	audit: {
		id: 'audit',
		description: 'Business action audit trail (append-only)',
		requires: ['dashboard'],
		optional: [],
		files: ['src/lib/server/audit/', 'src/routes/(app)/admin/audit/']
	},
	notifications: {
		id: 'notifications',
		description: 'Persistent business notifications (read/unread)',
		requires: ['dashboard'],
		optional: ['realtime', 'email'],
		files: ['src/lib/server/notifications/', 'src/lib/components/svforge/ui/NotificationsBell.svelte', 'src/routes/api/notifications/']
	},
	jobs: {
		id: 'jobs',
		description: 'Background job foundation (retry, progress, backend encapsulé)',
		requires: ['dashboard'],
		optional: ['realtime', 'notifications', 'email'],
		files: ['src/lib/server/jobs/']
	},
	chat: {
		id: 'chat',
		description: 'Composable app chat (conversations, messages, read-state)',
		requires: ['dashboard'],
		optional: ['realtime', 'uploads', 'notifications'],
		files: ['src/lib/server/chat/', 'src/routes/chat/']
	}
};

/** Reference presets — recipes that compose existing modules (#236). */
export const PRESETS: Record<string, Preset> = {
	saas: {
		description: 'Dashboard SaaS de départ : auth + admin + email + uploads',
		requires: 'dashboard',
		modules: ['email', 'uploads'],
		optional: ['tiptap', 'oauth', 'dnd']
	},
	community: {
		description: 'Site communautaire : base + blog + toast',
		requires: 'base',
		modules: ['blog', 'ui_toast'],
		optional: ['tiptap', 'graph']
	}
};

/**
 * Expand a preset into the concrete `sv add` spec (template + module names).
 * The user runs it with `sv add` (no parallel CLI): e.g.
 *   sv add 'svforge=template:dashboard' email uploads
 *
 * @returns The list of addon specifiers composing this preset.
 */
export function expandPreset(presetId: string): string[] {
	const preset = PRESETS[presetId];
	if (!preset) throw new Error(`Unknown preset "${presetId}". Available: ${Object.keys(PRESETS).join(', ')}`);
	const specs: string[] = [];
	if (preset.requires === 'dashboard') {
		specs.push("svforge=template:dashboard+testing:vitest");
	} else {
		specs.push("svforge=template:base+testing:vitest");
	}
	for (const mod of preset.modules) {
		specs.push(`@svforge/${mod}`);
	}
	return specs;
}

/**
 * Validate a composition: every module's `requires` template must be satisfied
 * by the chosen template, and all module ids must exist.
 *
 * @throws with a clear message on invalid composition.
 */
export function validateComposition(template: 'base' | 'dashboard', moduleIds: string[]): void {
	for (const id of moduleIds) {
		if (!MODULES[id]) {
			throw new Error(`Unknown module "${id}". Available: ${Object.keys(MODULES).join(', ')}`);
		}
		const meta = MODULES[id];
		if (meta.requires.includes('dashboard') && template !== 'dashboard') {
			throw new Error(
				`Module "${id}" requires the dashboard template (${meta.requires.join(', ')}). Run sv add svforge=template:dashboard first.`
			);
		}
	}
}
