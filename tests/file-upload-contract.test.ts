// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { compile } from 'svelte/compiler';
import { mount } from 'svelte';

const ROOT = process.cwd();
const FILE_UPLOAD = join(
	ROOT,
	'packages/uploads/templates/src/lib/components/svforge/uploads/FileUpload.svelte'
);
const COMPILED = join(ROOT, 'tests/__gen__/FileUpload.compiled.js');

/**
 * Regression guard for #279 — the FileUpload component must speak the same
 * contract as the /api/upload endpoint it ships with:
 *
 * - the presign request carries filename, contentType AND size (the endpoint
 *   rejects a request without a valid size with 400);
 * - the response is checked with res.ok BEFORE it is parsed as a presign
 *   payload (a 4xx body is an error object, not { url, key });
 * - the onUpload callback receives the persistent object key (the presigned
 *   URL expires after 60s and must not be treated as a stable reference).
 */
let Component: any;

beforeEach(async () => {
	vi.restoreAllMocks();
	// Compile the CURRENT template source once per test run.
	const source = readFileSync(FILE_UPLOAD, 'utf8');
	const { js } = compile(source, { generate: 'client', filename: 'FileUpload.svelte' });
	mkdirSync(dirname(COMPILED), { recursive: true });
	writeFileSync(COMPILED, js.code);
	Component = (await import(join(ROOT, 'tests/__gen__/FileUpload.compiled.js'))).default;
});

function makeFile(name = 'avatar.png', type = 'image/png', size = 500) {
	return new File([new Uint8Array(size)], name, { type });
}

function attachFile(container: HTMLElement, file: File) {
	const input = container.querySelector('input') as HTMLInputElement;
	Object.defineProperty(input, 'files', { value: [file], configurable: true });
	return input;
}

describe('FileUpload ↔ /api/upload contract (#279)', () => {
	it('sends filename, contentType AND size to the presign endpoint', async () => {
		const fetchMock = vi
			.fn()
			.mockResolvedValueOnce(
				new Response(JSON.stringify({ url: 'https://signed.example/x', key: 'uploads/abc-avatar.png' }), {
					status: 200,
					headers: { 'Content-Type': 'application/json' }
				})
			)
			.mockResolvedValueOnce(new Response(null, { status: 200 }));
		vi.stubGlobal('fetch', fetchMock);

		const target = document.createElement('div');
		const onUpload = vi.fn();
		mount(Component, { target, props: { onUpload } });

		const file = makeFile();
		attachFile(target, file).dispatchEvent(new Event('change', { bubbles: true }));

		await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));

		const presignCall = fetchMock.mock.calls[0];
		expect(presignCall[0]).toBe('/api/upload');
		const sent = JSON.parse(presignCall[1].body as string);
		expect(sent.filename).toBe('avatar.png');
		expect(sent.contentType).toBe('image/png');
		expect(sent.size).toBe(500);
	});

	it('checks res.ok before parsing the presign response', async () => {
		const fetchMock = vi
			.fn()
			// Endpoint rejects: missing/valid-size violation -> 400 with { error }
			.mockResolvedValueOnce(
				new Response(JSON.stringify({ error: 'Valid file size required' }), {
					status: 400,
					headers: { 'Content-Type': 'application/json' }
				})
			);
		vi.stubGlobal('fetch', fetchMock);

		const target = document.createElement('div');
		const onUpload = vi.fn();
		mount(Component, { target, props: { onUpload } });

		attachFile(target, makeFile()).dispatchEvent(new Event('change', { bubbles: true }));

		await vi.waitFor(() => expect(target.textContent).toContain('Valid file size required'));

		// Never a second (PUT) request, never a callback with an undefined key.
		expect(fetchMock).toHaveBeenCalledTimes(1);
		expect(onUpload).not.toHaveBeenCalled();
	});

	it('calls onUpload with the persistent object key on success', async () => {
		vi.stubGlobal(
			'fetch',
			vi
				.fn()
				.mockResolvedValueOnce(
					new Response(JSON.stringify({ url: 'https://signed.example/x', key: 'uploads/uuid-avatar.png' }), {
						status: 200,
						headers: { 'Content-Type': 'application/json' }
					})
				)
				.mockResolvedValueOnce(new Response(null, { status: 200 }))
		);

		const target = document.createElement('div');
		const onUpload = vi.fn();
		mount(Component, { target, props: { onUpload } });

		attachFile(target, makeFile()).dispatchEvent(new Event('change', { bubbles: true }));

		await vi.waitFor(() => expect(onUpload).toHaveBeenCalledTimes(1));
		expect(onUpload).toHaveBeenCalledWith('uploads/uuid-avatar.png');
	});

	it('shows a clean error message when the direct upload fails', async () => {
		vi.stubGlobal(
			'fetch',
			vi
				.fn()
				.mockResolvedValueOnce(
					new Response(JSON.stringify({ url: 'https://signed.example/x', key: 'uploads/uuid-avatar.png' }), {
						status: 200,
						headers: { 'Content-Type': 'application/json' }
					})
				)
				.mockResolvedValueOnce(new Response(null, { status: 500 }))
		);

		const target = document.createElement('div');
		const onUpload = vi.fn();
		mount(Component, { target, props: { onUpload } });

		attachFile(target, makeFile()).dispatchEvent(new Event('change', { bubbles: true }));

		await vi.waitFor(() => expect(target.textContent).toContain('Upload failed'));
		expect(onUpload).not.toHaveBeenCalled();
	});
});
