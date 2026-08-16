import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3 } from '$lib/server/s3';
import { env } from '$env/dynamic/private';
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/**
 * Maximum upload size in bytes (10 MB).
 *
 * NOTE (#193): on a presigned PUT, the ContentLength is signed into the URL
 * but is NOT enforced by S3 at upload time — a client that obtained the URL
 * can PUT a file of arbitrary size. This limit is therefore BEST-EFFORT at
 * the presigning stage. For a hard limit, use a presigned POST policy with
 * a `content-length-range` condition (contraignant côté S3), or verify with
 * HeadObject after upload.
 */
const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Allowed MIME types for uploads.
 *
 * NOTE (#193): image/svg+xml is deliberately EXCLUDED — an SVG can contain
 * embedded scripts. If the upload bucket is served from the same origin as
 * the app, displaying such a file executes script in the app's origin
 * (stored XSS). If SVG uploads are required, serve the bucket from a
 * dedicated domain and sanitize the SVG server-side before serving.
 */
const ALLOWED_MIME_TYPES = [
	'image/jpeg',
	'image/png',
	'image/gif',
	'image/webp',
	'application/pdf',
	'text/plain',
	'application/json'
] as const;

/**
 * Sanitize a filename: strip path separators, collapse dots/spaces,
 * and limit length. Returns a safe base name.
 */
function sanitizeFilename(name: string): string {
	// Remove any path separators and parent-directory sequences
	const cleaned = name.replace(/[/\\]/g, '').replace(/\.\.+/g, '.');
	// Collapse whitespace, trim, limit length
	const trimmed = cleaned.trim().replace(/\s+/g, '-').slice(0, 100);
	// Ensure non-empty fallback
	return trimmed || 'file';
}

export const POST: RequestHandler = async ({ request, locals }) => {
	// 1. Require authentication
	if (!locals.user) {
		throw error(401, { message: 'Authentication required' });
	}

	let filename: string;
	let contentType: string;
	let size: number;

	try {
		const body = await request.json();
		filename = body.filename;
		contentType = body.contentType;
		size = body.size;
	} catch {
		return json({ error: 'Invalid JSON body' }, { status: 400 });
	}

	// 2. Validate required fields
	if (!filename || typeof filename !== 'string') {
		return json({ error: 'Filename required' }, { status: 400 });
	}
	if (!contentType || typeof contentType !== 'string') {
		return json({ error: 'Content-Type required' }, { status: 400 });
	}

	// 3. Validate MIME type against allowlist
	if (!ALLOWED_MIME_TYPES.includes(contentType as (typeof ALLOWED_MIME_TYPES)[number])) {
		return json({ error: `File type ${contentType} is not allowed` }, { status: 400 });
	}

	// 4. Enforce maximum file size
	if (typeof size !== 'number' || size <= 0) {
		return json({ error: 'Valid file size required' }, { status: 400 });
	}
	if (size > MAX_FILE_SIZE) {
		return json({ error: `File exceeds maximum size of ${MAX_FILE_SIZE} bytes` }, { status: 413 });
	}

	// 5. Normalize the filename server-side
	const safeName = sanitizeFilename(filename);
	const key = `uploads/${crypto.randomUUID()}-${safeName}`;

	// 6. Issue the presigned URL with size constraint
	const command = new PutObjectCommand({
		Bucket: env.S3_BUCKET,
		Key: key,
		ContentType: contentType,
		ContentLength: size
	});

	const url = await getSignedUrl(s3, command, { expiresIn: 60 });
	return json({ url, key });
};
