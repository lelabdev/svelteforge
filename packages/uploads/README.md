# @svforge/uploads

SVForge Uploads — authenticated file uploads to S3-compatible storage.

## Install

```bash
npx sv add @svforge/uploads
```

## What it does

- Adds an S3 client and authenticated `/api/upload` signing endpoint
- Adds a `FileUpload` component with direct-to-storage uploads
- Uses a presigned **POST** policy with `content-length-range` by default

## Environment Variables

```env
S3_ENDPOINT=https://your-s3-or-r2-endpoint
S3_REGION=auto
S3_BUCKET=your-bucket-name
S3_ACCESS_KEY_ID=your-access-key
S3_SECRET_ACCESS_KEY=your-secret-key
# Default: presigned-post. Use presigned-put only when POST policies are unsupported.
S3_UPLOAD_SIZE_POLICY=presigned-post
# Optional per-user, per-upload cap in bytes (application-level 413 before signing).
# S3_USER_QUOTA_BYTES=10485760
```

## Size policies

`presigned-post` is the default **storage-enforced** policy. It requires an
S3-compatible backend that supports presigned POST policies and enforces a
10 MiB `content-length-range` on the complete multipart request before an
object is stored. Multipart fields and boundaries are part of that request, so
`FileUpload` reserves a bounded 64 KiB envelope: the largest accepted file is
10,420,224 bytes (9.94 MiB), not 10 MiB. A client cannot bypass the 10 MiB
storage request limit by lying about its declared size.

Set `S3_UPLOAD_SIZE_POLICY=presigned-put` only when the backend does not
support POST policies. This fallback validates the declared size before signing
but is explicitly **best-effort**: a holder of the PUT URL may upload a larger
object. Do not use it where a hard storage limit is required; use a provider
with POST policies or add a size-limited server proxy/post-upload verification.

AWS S3 supports the default. Verify POST-policy support with any other
S3-compatible backend before selecting it.

## When size must be TRULY enforced (#332)

Three complementary layers — know exactly what each one guarantees:

1. **POST policy (default, storage-enforced).** `presigned-post` makes the
   backend reject any multipart request outside the signed
   `content-length-range` (10 MiB on the complete request) BEFORE an object is
   stored. This is the only layer the storage itself enforces. Verify POST
   policy support on your backend (AWS S3: yes).

2. **Per-user quota (application-enforced).** Set `S3_USER_QUOTA_BYTES` for a
   per-user, per-upload cap: the endpoint answers `413` before signing
   anything. It does NOT track a per-user TOTAL — that needs accounting
   SVForge cannot invent for you. Replace `src/lib/uploads/quota.ts` with your
   own lookup (usage table, bucket listing, billing hook) and keep the same
   `parseUserQuotaBytes` / `quotaExceededMessage` contract.

3. **Scan callback (storage-side, asynchronous).** Size is not content safety:
   wire a malware scan that triggers on object creation — R2 malware
   protection / S3 Event Notifications → Lambda scanner (ClamAV or similar).
   The scanner inspects the object and on detection moves it to a
   **quarantine** bucket/prefix and notifies you (email, webhook). Serve user
   uploads only from the clean location, never directly from the upload key.
   Pair with the audit module for a trail of scan outcomes.

The `presigned-put` fallback is **best-effort**: the signed `ContentLength` is
not enforced by the storage, so a holder of the PUT URL can store a larger
object. Never use it where a hard limit is required.

## Usage

```svelte
<script>
	import FileUpload from '$lib/components/svforge/uploads/FileUpload.svelte';
</script>

<FileUpload onUpload={(key) => console.log('Uploaded:', key)} />
```

The callback receives the persistent object key, never an expiring URL.

## License

MIT
