import { S3Client } from '@aws-sdk/client-s3';
import { env } from '$env/dynamic/private';

if (!env.S3_ENDPOINT || !env.S3_ACCESS_KEY_ID) throw new Error('S3 credentials are not set');

export const s3 = new S3Client({
	region: env.S3_REGION ?? 'auto',
	endpoint: env.S3_ENDPOINT,
	credentials: { accessKeyId: env.S3_ACCESS_KEY_ID, secretAccessKey: env.S3_SECRET_ACCESS_KEY }
});
