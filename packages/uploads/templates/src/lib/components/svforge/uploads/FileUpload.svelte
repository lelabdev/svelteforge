<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';

	/**
	 * Called once the file has been uploaded to S3/R2, with the PERSISTENT
	 * object key (`uploads/<uuid>-<name>`).
	 *
	 * The presigned URL itself expires after 60s and must not be stored or
	 * treated as a stable reference — `key` is the canonical identifier the
	 * consumer project should persist (e.g. in a DB row).
	 */
	let { onUpload }: { onUpload?: (key: string) => void } = $props();

	let uploading = $state(false);
	let error = $state('');

	async function handleFile(e: Event) {
		const input = e.target as HTMLInputElement;
		if (!input.files || input.files.length === 0) return;
		const file = input.files[0];

		uploading = true;
		error = '';

		try {
			// 1. Request a presigned PUT URL with the FULL contract of the
			// /api/upload endpoint: filename, contentType AND size. A request
			// without a valid size is rejected with 400 (regression #279).
			const res = await fetch('/api/upload', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					filename: file.name,
					contentType: file.type,
					size: file.size
				})
			});

			// 2. Check the response BEFORE parsing: a 4xx body is an error
			// payload ({ error }), not a presign response ({ url, key }).
			if (!res.ok) {
				let message = m.uploads_failed();
				try {
					const body = await res.json();
					if (body?.error) message = body.error;
				} catch {
					// keep the generic message when the body is not JSON
				}
				throw new Error(message);
			}

			const { url, key } = await res.json();

			// 3. PUT the file directly to the presigned URL.
			const uploadRes = await fetch(url, {
				method: 'PUT',
				body: file,
				headers: { 'Content-Type': file.type }
			});
			if (!uploadRes.ok) throw new Error(m.uploads_failed());

			// 4. Deliver the persistent key — never the expiring URL.
			onUpload?.(key);
		} catch (err: any) {
			error = err.message;
		} finally {
			uploading = false;
		}
	}
</script>

<div>
	<input type="file" onchange={handleFile} disabled={uploading} />
	{#if uploading}<span>{m.uploads_uploading()}</span>{/if}
	{#if error}<p style="color: red">{error}</p>{/if}
</div>
