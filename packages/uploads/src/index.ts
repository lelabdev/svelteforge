import { defineAddon, defineAddonOptions } from 'sv';
import { files } from './templates';

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
	},

	nextSteps: ({ options }) => [
		'@svforge/uploads installed!',
		'Add S3/R2 credentials to .env: S3_ENDPOINT, S3_REGION, S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY',
		'Usage: <FileUpload onUpload={(url) => console.log(url)} />',
		...(options.testpack
			? ['Test pack installed: bun run test (upload endpoint security)']
			: [])
	]
});
