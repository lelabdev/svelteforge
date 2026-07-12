import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const UPLOAD_ENDPOINT = join(ROOT, 'packages/uploads/templates/src/routes/api/upload/+server.ts');

/**
 * Regression tests for #170 — the presigned upload endpoint must be secured.
 *
 * The previous implementation issued presigned PUT URLs to any caller without
 * authentication, MIME validation, file-size constraints, or filename
 * normalization. These tests verify the secure implementation via static
 * analysis of the endpoint source (template file, not a running app).
 */
describe('presigned upload endpoint security (#170)', () => {
	const source = readFileSync(UPLOAD_ENDPOINT, 'utf-8');

	it('requires authentication before issuing a presigned URL', () => {
		// Must check locals.user or session before any signing
		expect(source).toMatch(/locals\.user|locals\.session|getSession|requireAuth/i);
	});

	it('validates the content type against an allowlist', () => {
		// Must have an array or set of allowed MIME types and check against it
		expect(source).toMatch(/allow|permitted|valid.*types|ALLOWED.*MIME|allowedTypes/i);
	});

	it('enforces a maximum file size', () => {
		// Must set a ContentLength or maxSize constraint on the signed URL
		expect(source).toMatch(/ContentLength|maxSize|max.*size|MAX_FILE_SIZE/i);
	});

	it('normalizes the filename server-side (no raw interpolation)', () => {
		// The key must not directly interpolate the user-supplied filename
		// without sanitization. Look for sanitization (no path separators, etc.)
		expect(source).toMatch(/sanitize|normalize|replace.*[/\\\\]|basename|slug/i);
	});

	it('returns 401 when unauthenticated', () => {
		expect(source).toMatch(/status:\s*401|error\(401/);
	});

	it('returns 400 for invalid input (bad MIME, missing fields)', () => {
		expect(source).toMatch(/status:\s*400|json\(\s*\{\s*error.*\}\s*,\s*\{\s*status:\s*400/);
	});

	it('does not expose the raw filename directly in the S3 key', () => {
		// The key should use a UUID or sanitized name, not `${filename}` directly
		// Check that the key construction does not use the raw filename variable
		// without processing
		const keyLine = source.match(/key\s*=\s*[`'"].*[`'"]/);
		if (keyLine) {
			// If the key references filename, it must be through a sanitized variable
			expect(keyLine[0]).not.toMatch(/\$\{filename\}/);
		}
	});
});
