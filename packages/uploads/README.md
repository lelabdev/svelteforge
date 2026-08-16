# @svforge/uploads

SVForge Uploads — file uploads to S3/R2 with presigned URLs.

## Install

```bash
npx sv add @svforge/uploads
```

## What it does

- Adds `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner` dependencies
- Creates a server-side S3 client (`$lib/server/s3`)
- Creates a presigned URL API endpoint (`/api/upload`)
- Creates a `FileUpload` component with drag-and-drop support

## Environment Variables

Add these to your `.env`:

```env
S3_ENDPOINT=https://your-s3-or-r2-endpoint
S3_REGION=auto
S3_BUCKET=your-bucket-name
S3_ACCESS_KEY_ID=your-access-key
S3_SECRET_ACCESS_KEY=your-secret-key
```

Works with **AWS S3**, **Cloudflare R2**, **Backblaze B2**, **MinIO**, or any S3-compatible storage.

## Usage

```svelte
<script>
	import FileUpload from '$lib/components/svforge/uploads/FileUpload.svelte';
</script>

<FileUpload onUpload={(key) => console.log('Uploaded:', key)} />
```

## How it works

1. The client requests a presigned PUT URL from `/api/upload`
2. The server generates a presigned URL with 60s expiry
3. The client uploads the file directly to S3/R2 (no server bandwidth used)
4. The `onUpload` callback receives the object key

## License

MIT
