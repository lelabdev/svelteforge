import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3 } from '$lib/server/s3';
import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';

export async function POST({ request }) {
	const { filename, contentType } = await request.json();
	if (!filename) return json({ error: 'Filename required' }, { status: 400 });

	const key = `uploads/${crypto.randomUUID()}-${filename}`;
	const command = new PutObjectCommand({
		Bucket: env.S3_BUCKET,
		Key: key,
		ContentType: contentType
	});

	const url = await getSignedUrl(s3, command, { expiresIn: 60 });
	return json({ url, key });
}
