import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the S3 client and env so the endpoint logic is testable without AWS.
vi.mock('$lib/server/s3', () => ({
	getS3: () => ({})
}));

const createPresignedPost = vi.fn().mockResolvedValue({
	url: 'https://signed.example/post',
	fields: { key: 'uploads/signed-key', 'Content-Type': 'image/png' }
});
vi.mock('@aws-sdk/s3-presigned-post', () => ({ createPresignedPost }));
vi.mock('@aws-sdk/s3-request-presigner', () => ({
	getSignedUrl: vi.fn().mockResolvedValue('https://signed.example/url')
}));

vi.mock('$env/dynamic/private', () => ({
	env: { S3_BUCKET: 'test-bucket' }
}));

// Import the endpoint AFTER mocks are registered.
const { POST } = await import('./+server');

function makeRequest(body: unknown, user: unknown = { id: 'u1' }) {
	return {
		request: {
			json: () => Promise.resolve(body)
		},
		locals: { user }
	} as any;
}

describe('upload endpoint security (test pack)', () => {
	it('requires authentication (401)', async () => {
		// SvelteKit error() throws — catch it and check status.
		let caught: any;
		try {
			await POST(makeRequest({}, null));
		} catch (e) {
			caught = e;
		}
		expect(caught).toBeDefined();
		expect(caught?.status).toBe(401);
	});

	it('rejects invalid MIME types (400)', async () => {
		const res = await POST(
			makeRequest({ filename: 'x.exe', contentType: 'application/x-msdownload', size: 100 })
		);
		expect(res.status).toBe(400);
	});

	it('rejects files over the size limit (413)', async () => {
		const res = await POST(
			makeRequest({ filename: 'big.png', contentType: 'image/png', size: 20 * 1024 * 1024 })
		);
		expect(res.status).toBe(413);
	});

	it('sanitizes filenames in the S3 key', async () => {
		const res = await POST(
			makeRequest({ filename: '../../evil.png', contentType: 'image/png', size: 100 })
		);
		expect(res.status).toBe(200);
		const body = await res.json();
		// The key starts with the uploads/ prefix, then must not contain
		// path separators or parent-directory sequences.
		expect(body.key.startsWith('uploads/')).toBe(true);
		const rest = body.key.slice('uploads/'.length);
		expect(rest).not.toMatch(/\/|\.\./);
	});

	it('issues a storage-enforced POST policy for a valid upload', async () => {
		const res = await POST(
			makeRequest({ filename: 'avatar.png', contentType: 'image/png', size: 500 })
		);
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.method).toBe('POST');
		expect(body.sizePolicy).toBe('storage-enforced');
		expect(body.url).toContain('signed');
	});

	it('makes a lying declared size unable to store an oversized object in hard-limit mode', async () => {
		await POST(makeRequest({ filename: 'avatar.png', contentType: 'image/png', size: 1 }));
		expect(createPresignedPost).toHaveBeenCalledWith(
			expect.anything(),
			expect.objectContaining({
				Conditions: expect.arrayContaining([['content-length-range', 1, 10 * 1024 * 1024]])
			})
		);
	});
});
