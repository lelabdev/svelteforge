import { defineAddon, defineAddonOptions } from 'sv';
import { files } from './templates';

export default defineAddon({
id: 'svforge-uploads',
alias: 'forge-uploads',
shortDescription: 'SVForge Uploads — file uploads to S3/R2',
homepage: 'https://github.com/lelabdev/svelteforge',
	// Empty options required: sv >= 0.15 crashes on addons without an
	// options object (Object.entries(undefined) in promptAddonQuestions).
	options: defineAddonOptions().build(),

setup: ({ unsupported, isKit }) => {
if (!isKit) unsupported('SVForge Uploads requires SvelteKit');
},

run: ({ sv }) => {
sv.dependency('@aws-sdk/client-s3', 'latest');
sv.dependency('@aws-sdk/s3-request-presigner', 'latest');

for (const [path, content] of Object.entries(files)) {
sv.file(`src${path}`, () => content);
}
},

nextSteps: () => [
'@svforge/uploads installed!',
'Add S3/R2 credentials to .env: S3_ENDPOINT, S3_REGION, S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY',
'Usage: <FileUpload onUpload={(url) => console.log(url)} />'
]
});
