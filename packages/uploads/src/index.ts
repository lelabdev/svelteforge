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
		sv.file('.svforge.json', (content) => enrichManifest(content, 'uploads'));
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
