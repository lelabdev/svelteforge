/**
 * SVForge AI context generation (#234).
 *
 * Generates two outputs in the target project, derived from its REAL state
 * (template + installed modules), not from generic docs:
 *
 *   .svforge.json  — machine-readable manifest (schema: 1)
 *   llms.txt       — concise LLM/human-readable context
 *
 * The base/dashboard modes write the initial context at scaffold time; each
 * module ENRICHES it without overwriting user edits (merge semantics).
 * `svforge context` regenerates deterministically.
 */

export interface SvforgeManifest {
	schema: 1;
	template: 'base' | 'dashboard';
	stack: {
		framework: 'sveltekit';
		ui: 'skeleton';
		i18n: 'paraglide';
		test: 'vitest';
		auth?: 'better-auth';
		orm?: 'drizzle';
	};
	modules: string[];
	capabilities: string[];
	patterns: Record<string, string>;
	generatedBy: string;
}

const BASE_CAPABILITIES = [
	'skeleton-ui',
	'paraglide-fr-en',
	'vitest',
	'seo',
	'sitemap',
	'theme',
	'layouts'
];

const DASHBOARD_CAPABILITIES = [
	'auth',
	'db',
	'admin',
	'user-management',
	'zod-validation'
];

const BASE_PATTERNS: Record<string, string> = {
	'UI components': 'src/lib/components/svforge/',
	'Theming': 'src/lib/styles/',
	'i18n messages': 'messages/',
	'SEO': 'src/lib/components/svforge/ui/Seo.svelte'
};

const DASHBOARD_PATTERNS: Record<string, string> = {
	'Auth guard': 'src/routes/(app)/admin/*/+page.server.ts',
	'DB access': 'src/lib/server/db/',
	'Schemas (zod)': 'src/lib/server/schemas.ts',
	'Setup': 'scripts/setup.sh'
};

/** Capabilities contributed by each module (#236 metadata + #234 context). */
export const MODULE_CAPABILITIES: Record<string, { capability: string; pattern?: string; note?: string }> = {
	email: { capability: 'email (Resend)', pattern: 'src/lib/server/email.ts', note: 'Transactional emails via RESEND_API_KEY' },
	uploads: { capability: 'uploads (S3/R2 presigned)', pattern: 'src/routes/api/upload/+server.ts', note: 'FileUpload at src/lib/components/svforge/uploads/' },
	oauth: { capability: 'oauth (Google/GitHub)', pattern: 'src/lib/components/svforge/ui/OAuthButtons.svelte', note: 'Requires dashboard' },
	ui_toast: { capability: 'toasts (Skeleton Toast)', pattern: 'src/lib/components/svforge/ui/Toaster.svelte', note: 'Add <Toaster /> to root layout' },
	dnd: { capability: 'drag & drop', pattern: 'src/lib/components/svforge/dnd/SortableList.svelte' },
	tiptap: { capability: 'rich text (Tiptap)', pattern: 'src/lib/components/svforge/tiptap/', note: 'Toolbar + preview' },
	graph: { capability: 'knowledge graph', pattern: 'src/lib/components/svforge/graph/KnowledgeGraph.svelte' },
	blog: { capability: 'blog (MDsveX)', pattern: 'src/routes/blog/', note: 'Posts as .md in src/posts/' },
	realtime: { capability: 'realtime (WebSocket)', pattern: 'src/lib/server/realtime/', note: 'Publish/subscribe hub + Svelte client' },
	audit: { capability: 'audit trail', pattern: 'src/lib/server/audit/', note: 'Append-only business action log' },
	notifications: { capability: 'notifications', pattern: 'src/lib/server/notifications/', note: 'Persistent read/unread inbox' },
	jobs: { capability: 'background jobs', pattern: 'src/lib/server/jobs/', note: 'Encapsulated queue, bounded retries, progress' },
	chat: { capability: 'chat', pattern: 'src/lib/server/chat/', note: 'Conversations + messages + read-state, membership-enforced' }
};

/** Build the manifest for a given template + installed modules. */
export function buildManifest(template: 'base' | 'dashboard', modules: string[]): SvforgeManifest {
	const capabilities = [...BASE_CAPABILITIES];
	const patterns = { ...BASE_PATTERNS };
	if (template === 'dashboard') {
		capabilities.push(...DASHBOARD_CAPABILITIES);
		Object.assign(patterns, DASHBOARD_PATTERNS);
	}
	for (const mod of modules) {
		const meta = MODULE_CAPABILITIES[mod];
		if (!meta) continue;
		capabilities.push(meta.capability);
		if (meta.pattern) patterns[meta.capability] = meta.pattern;
	}
	return {
		schema: 1,
		template,
		stack: {
			framework: 'sveltekit',
			ui: 'skeleton',
			i18n: 'paraglide',
			test: 'vitest',
			...(template === 'dashboard' ? { auth: 'better-auth', orm: 'drizzle' } : {})
		},
		modules,
		capabilities: [...new Set(capabilities)],
		patterns,
		generatedBy: 'svforge'
	};
}

/** Render the human/LLM-readable llms.txt from a manifest. */
export function renderLlmstxt(manifest: SvforgeManifest): string {
	const lines: string[] = [];
	lines.push('# SvelteForge project');
	lines.push('');
	lines.push(`Template: ${manifest.template}`);
	lines.push('Stack: SvelteKit + Skeleton UI v5 + Tailwind v4 + Paraglide FR/EN + Vitest');
	if (manifest.stack.auth) lines.push(`Auth: ${manifest.stack.auth}  •  ORM: ${manifest.stack.orm}`);
	lines.push('');
	lines.push('## Capabilities installed');
	for (const cap of manifest.capabilities) lines.push(`- ${cap}`);
	lines.push('');
	lines.push('## Canonical patterns');
	for (const [name, path] of Object.entries(manifest.patterns)) {
		lines.push(`- ${name}: ${path}`);
	}
	lines.push('');
	lines.push('## Rules for AI agents');
	lines.push('MUST:');
	lines.push('- reuse installed components/modules before creating alternatives');
	lines.push('- use Skeleton/Skeleton Svelte for rich UI (dialog, tabs, tooltip…)');
	lines.push('- use Paraglide messages (fr + en) for user-facing copy');
	lines.push('- follow the canonical patterns above');
	lines.push('MUST NOT:');
	lines.push('- install a second ORM, auth provider or UI kit without explicit requirement');
	lines.push('- recreate Button/Input/Card/Table primitives (they exist)');
	lines.push('- modify generated internals (src/lib/paraglide, .svforge.json) without understanding the workflow');
	lines.push('');
	lines.push('## Inspect first');
	lines.push('- AGENTS.md (full conventions)');
	lines.push('- src/lib/components/svforge/ (component catalog)');
	lines.push('- svforge-catalog.json (machine-readable catalog)');
	lines.push('- svforge-modules.json (module metadata)');
	return lines.join('\n');
}

/** Merge module contributions into an existing manifest (idempotent). */
export function mergeManifest(existing: SvforgeManifest, template: 'base' | 'dashboard', modules: string[]): SvforgeManifest {
	const merged = buildManifest(template, [...new Set([...existing.modules, ...modules])]);
	return merged;
}

/**
 * Enrichment callback for modules (#234): given the existing .svforge.json
 * content ('' on first write), return the merged manifest JSON.
 */
export function enrichManifest(content: string, moduleId: string): string {
	let existing: SvforgeManifest;
	try {
		existing = content && content.trim() ? JSON.parse(content) : buildManifest('base', []);
	} catch {
		existing = buildManifest('base', []);
	}
	const merged = mergeManifest(existing, existing.template ?? 'base', [moduleId]);
	return `${JSON.stringify(merged, null, 2)}\n`;
}

/**
 * Regenerate llms.txt deterministically from the project's .svforge.json
 * (run via `svforge context`). Returns the new llms.txt content.
 */
export function regenerateLlmstxt(manifestContent: string): string {
	try {
		const manifest = JSON.parse(manifestContent) as SvforgeManifest;
		// Rebuild from the template + installed modules so capabilities/patterns
		// always reflect the real state (module enrich only adds its id).
		const rebuilt = buildManifest(manifest.template ?? 'base', manifest.modules ?? []);
		return renderLlmstxt(rebuilt);
	} catch {
		return renderLlmstxt(buildManifest('base', []));
	}
}
