import { PutObjectCommand } from '@aws-sdk/client-s3';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getS3 } from '$lib/server/s3';
import { env } from '$env/dynamic/private';
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/** Maximum upload size in bytes (10 MB). */
const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Upload policy selected by the deployment.
 *
 * `presigned-post` is the default hard-limit mode. S3-compatible providers
 * that implement POST policies enforce content-length-range before storing an
 * object. Set S3_UPLOAD_SIZE_POLICY=presigned-put only for providers without
 * POST-policy support: it validates the declared size before signing, but is
 * explicitly best-effort because a holder of the PUT URL can upload more.
 */
const sizePolicy = env.S3_UPLOAD_SIZE_POLICY === 'presigned-put' ? 'best-effort' : 'storage-enforced';

/**
 * Allowed MIME types for uploads. SVG is deliberately EXCLUDED: serving an
 * untrusted SVG from the app origin can result in stored XSS.
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

function sanitizeFilename(name: string): string {
	const cleaned = name.replace(/[/\\]/g, '').replace(/\.\.+/g, '.');
	const trimmed = cleaned.trim().replace(/\s+/g, '-').slice(0, 100);
	return trimmed || 'file';
}

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) throw error(401, { message: 'Authentication required' });

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

	if (!filename || typeof filename !== 'string') return json({ error: 'Filename required' }, { status: 400 });
	if (!contentType || typeof contentType !== 'string') return json({ error: 'Content-Type required' }, { status: 400 });
	if (!ALLOWED_MIME_TYPES.includes(contentType as (typeof ALLOWED_MIME_TYPES)[number])) {
		return json({ error: `File type ${contentType} is not allowed` }, { status: 400 });
	}
	if (typeof size !== 'number' || size <= 0) return json({ error: 'Valid file size required' }, { status: 400 });
	if (size > MAX_FILE_SIZE) return json({ error: `File exceeds maximum size of ${MAX_FILE_SIZE} bytes` }, { status: 413 });

	const key = `uploads/${crypto.randomUUID()}-${sanitizeFilename(filename)}`;
	if (sizePolicy === 'storage-enforced') {
		const post = await createPresignedPost(getS3(), {
			Bucket: env.S3_BUCKET!,
			Key: key,
			Fields: { 'Content-Type': contentType },
			Conditions: [
				['content-length-range', 1, MAX_FILE_SIZE],
				['eq', '$Content-Type', contentType]
			],
			Expires: 60
		});
		return json({ method: 'POST', ...post, key, sizePolicy });
	}

	// Fallback only: ContentLength is signed but does not constrain the object
	// S3 stores. Do not represent this declared-size validation as a hard limit.
	const url = await getSignedUrl(
		getS3(),
		new PutObjectCommand({ Bucket: env.S3_BUCKET!, Key: key, ContentType: contentType, ContentLength: size }),
		{ expiresIn: 60 }
	);
	return json({ method: 'PUT', url, key, sizePolicy });
};
