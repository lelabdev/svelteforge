// AUTO-GENERATED - DO NOT EDIT
// Run bun run prebuild to regenerate from CHANGELOG.md

export interface ChangelogEntry {
	package: string;
	version: string;
	date: string;
	body: string;
}

export const RELEASE_NOTES: ChangelogEntry[] = [
  {
    "package": "svforge",
    "version": "1.2.0",
    "date": "2026-09-06",
    "body": "## svforge@1.2.0 — 2026-09-06\n\n### Breaking changes\n- None.\n\n### Migrations\n- None.\n\n### Fixes\n- Initial documented release baseline for the SvelteForge base and dashboard add-on.\n\n### Deprecations\n- None."
  },
  {
    "package": "@svforge/audit",
    "version": "0.0.1",
    "date": "2026-09-06",
    "body": "## @svforge/audit@0.0.1 — 2026-09-06\n\n### Breaking changes\n- None.\n\n### Migrations\n- None.\n\n### Fixes\n- Initial documented release baseline for the audit module.\n\n### Deprecations\n- None."
  },
  {
    "package": "@svforge/blog",
    "version": "0.0.1",
    "date": "2026-09-06",
    "body": "## @svforge/blog@0.0.1 — 2026-09-06\n\n### Breaking changes\n- None.\n\n### Migrations\n- None.\n\n### Fixes\n- Initial documented release baseline for the blog module.\n\n### Deprecations\n- None."
  },
  {
    "package": "@svforge/chat",
    "version": "0.0.1",
    "date": "2026-09-06",
    "body": "## @svforge/chat@0.0.1 — 2026-09-06\n\n### Breaking changes\n- None.\n\n### Migrations\n- None.\n\n### Fixes\n- Initial documented release baseline for the chat module.\n\n### Deprecations\n- None."
  },
  {
    "package": "@svforge/dnd",
    "version": "0.0.2",
    "date": "2026-09-06",
    "body": "## @svforge/dnd@0.0.2 — 2026-09-06\n\n### Breaking changes\n- None.\n\n### Migrations\n- None.\n\n### Fixes\n- Initial documented release baseline for the drag-and-drop module.\n\n### Deprecations\n- None."
  },
  {
    "package": "@svforge/email",
    "version": "0.0.1",
    "date": "2026-09-06",
    "body": "## @svforge/email@0.0.1 — 2026-09-06\n\n### Breaking changes\n- None.\n\n### Migrations\n- None.\n\n### Fixes\n- Initial documented release baseline for the email module.\n\n### Deprecations\n- None."
  },
  {
    "package": "@svforge/graph",
    "version": "0.0.1",
    "date": "2026-09-06",
    "body": "## @svforge/graph@0.0.1 — 2026-09-06\n\n### Breaking changes\n- None.\n\n### Migrations\n- None.\n\n### Fixes\n- Initial documented release baseline for the graph module.\n\n### Deprecations\n- None."
  },
  {
    "package": "@svforge/jobs",
    "version": "0.0.1",
    "date": "2026-09-06",
    "body": "## @svforge/jobs@0.0.1 — 2026-09-06\n\n### Breaking changes\n- None.\n\n### Migrations\n- None.\n\n### Fixes\n- Initial documented release baseline for the jobs module.\n\n### Deprecations\n- None."
  },
  {
    "package": "@svforge/notifications",
    "version": "0.0.1",
    "date": "2026-09-06",
    "body": "## @svforge/notifications@0.0.1 — 2026-09-06\n\n### Breaking changes\n- None.\n\n### Migrations\n- None.\n\n### Fixes\n- Initial documented release baseline for the notifications module.\n\n### Deprecations\n- None."
  },
  {
    "package": "@svforge/oauth",
    "version": "0.0.1",
    "date": "2026-09-06",
    "body": "## @svforge/oauth@0.0.1 — 2026-09-06\n\n### Breaking changes\n- None.\n\n### Migrations\n- None.\n\n### Fixes\n- Initial documented release baseline for the OAuth module.\n\n### Deprecations\n- None."
  },
  {
    "package": "@svforge/realtime",
    "version": "0.0.1",
    "date": "2026-09-06",
    "body": "## @svforge/realtime@0.0.1 — 2026-09-06\n\n### Breaking changes\n- None.\n\n### Migrations\n- None.\n\n### Fixes\n- Initial documented release baseline for the realtime module.\n\n### Deprecations\n- None."
  },
  {
    "package": "@svforge/tiptap",
    "version": "0.0.2",
    "date": "2026-09-06",
    "body": "## @svforge/tiptap@0.0.2 — 2026-09-06\n\n### Breaking changes\n- None.\n\n### Migrations\n- None.\n\n### Fixes\n- Initial documented release baseline for the Tiptap module.\n\n### Deprecations\n- None."
  },
  {
    "package": "@svforge/ui_toast",
    "version": "0.0.2",
    "date": "2026-09-06",
    "body": "## @svforge/ui_toast@0.0.2 — 2026-09-06\n\n### Breaking changes\n- None.\n\n### Migrations\n- None.\n\n### Fixes\n- Initial documented release baseline for the toast UI module.\n\n### Deprecations\n- None."
  },
  {
    "package": "@svforge/uploads",
    "version": "0.0.1",
    "date": "2026-09-06",
    "body": "## @svforge/uploads@0.0.1 — 2026-09-06\n\n### Breaking changes\n- None.\n\n### Migrations\n- None.\n\n### Fixes\n- Initial documented release baseline for the uploads module.\n\n### Deprecations\n- None."
  },
  {
    "package": "eslint-plugin-svforge",
    "version": "1.2.0",
    "date": "2026-09-06",
    "body": "## eslint-plugin-svforge@1.2.0 — 2026-09-06\n\n### Breaking changes\n- None.\n\n### Migrations\n- None.\n\n### Fixes\n- Initial release of deterministic SvelteForge design-system ESLint diagnostics.\n\n### Deprecations\n- None."
  }
];

function compareVersions(left: string, right: string): number {
	const parse = (version: string) => version.split(/[.-]/).map((part) => (/^\d+$/.test(part) ? Number(part) : part));
	const a = parse(left);
	const b = parse(right);
	for (let index = 0; index < 3; index++) {
		if (a[index] !== b[index]) return (a[index] as number) - (b[index] as number);
	}
	return 0;
}

export function entriesBetween(entries: ChangelogEntry[], packageName: string, fromVersion: string | null, toVersion: string): ChangelogEntry[] {
	return entries
		.filter((entry) => entry.package === packageName)
		.filter((entry) => (!fromVersion || compareVersions(entry.version, fromVersion) > 0) && compareVersions(entry.version, toVersion) <= 0)
		.sort((left, right) => compareVersions(left.version, right.version));
}
