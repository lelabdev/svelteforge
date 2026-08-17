import { defineAddon, defineAddonOptions } from 'sv';
import { files } from './templates';

/**
 * Merge Paraglide catalog entries into an existing messages/{locale}.json
 * (#239). Never overwrites existing keys; preserves the $schema header.
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

/**
 * Enrich the project's .svforge.json AI manifest (#234) without overwriting
 * user edits. Small inline helper — modules are standalone packages.
 */
function enrichManifest(content, moduleId, capability, pattern) {
	let manifest = { template: 'base', modules: [], capabilities: [], patterns: {} };
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
	id: 'svforge-uploads',
	alias: 'forge-uploads',
	shortDescription: 'SVForge Uploads — file uploads to S3/R2',
	homepage: 'https://github.com/lelabdev/svelteforge',
	options: defineAddonOptions()
		.add('testpack', {
			question: 'Install the upload security test pack? (vitest, regression guards for the endpoint)',
			type: 'boolean',
			default: false
		})
		.build(),

	setup: ({ unsupported, isKit }) => {
		if (!isKit) unsupported('SVForge Uploads requires SvelteKit');
	},

	run: ({ sv, options }) => {
		sv.dependency('@aws-sdk/client-s3', '^3.1111.0');
		sv.dependency('@aws-sdk/s3-request-presigner', '^3.1111.0');
		// Test pack needs vitest + a test script in the target project (#182)
		if (options.testpack) {
			sv.devDependency('vitest', '^4.1.5');
			sv.devDependency('jsdom', '^29.1.1');
			sv.file('package.json', (content) => {
				if (!content || content.includes('"test"')) return content;
				const pkg = JSON.parse(content);
				pkg.scripts = { ...(pkg.scripts || {}), test: 'vitest run' };
				return `${JSON.stringify(pkg, null, 2)}\n`;
			});
		}

		for (const [path, content] of Object.entries(files)) {
			// The security test pack is opt-in (#182): only write it when selected.
			if (path === '/routes/api/upload/upload-security.test.ts' && !options.testpack) continue;
			sv.file(`src${path}`, () => content);
		}

		// Paraglide messages (#239): merge FR/EN uploads copy into the project
		// catalogs without overwriting existing keys.
		sv.file('messages/fr.json', (content) =>
			mergeMessages(content, {
				uploads_uploading: 'Téléversement…',
				uploads_failed: 'Échec du téléversement'
			})
		);
		sv.file('messages/en.json', (content) =>
			mergeMessages(content, {
				uploads_uploading: 'Uploading…',
				uploads_failed: 'Upload failed'
			})
		);

		// AI context (#234): declare this module in .svforge.json.
		sv.file('.svforge.json', (content) => enrichManifest(content, 'uploads', 'uploads (S3/R2 presigned)', 'src/routes/api/upload/+server.ts'));
		sv.file('llms.txt', (content) => mergeLlmstxt(content, 'uploads (S3/R2 presigned)', 'src/routes/api/upload/+server.ts'));
	},

	nextSteps: ({ options }) => [
		'@svforge/uploads installed!',
		'Add S3/R2 credentials to .env: S3_ENDPOINT, S3_REGION, S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY',
		'Usage: <FileUpload onUpload={(key) => console.log(key)} /> — key is the persistent object key, not the expiring presigned URL',
		...(options.testpack
			? ['Test pack installed: bun run test (upload endpoint security)']
			: [])
	]
});
