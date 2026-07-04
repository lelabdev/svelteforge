<script lang="ts">
	let { onUpload }: { onUpload?: (url: string) => void } = $props();

	let uploading = $state(false);
	let error = $state('');

	async function handleFile(e: Event) {
		const input = e.target as HTMLInputElement;
		if (!input.files || input.files.length === 0) return;
		const file = input.files[0];

		uploading = true;
		error = '';

		try {
			const res = await fetch('/api/upload', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ filename: file.name, contentType: file.type })
			});
			const { url, key } = await res.json();

			const uploadRes = await fetch(url, {
				method: 'PUT',
				body: file,
				headers: { 'Content-Type': file.type }
			});
			if (!uploadRes.ok) throw new Error('Upload failed');

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
	{#if uploading}<span>Uploading...</span>{/if}
	{#if error}<p style="color: red">{error}</p>{/if}
</div>
