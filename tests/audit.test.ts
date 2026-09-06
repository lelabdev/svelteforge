import { afterEach, describe, expect, it, vi } from 'vitest';

const { formatFindings, loadBaseline, queryOsv, resolvedPackages } = await import('../scripts/audit.mjs');

describe('dependency audit (#351)', () => {
	afterEach(() => vi.restoreAllMocks());

	it('extracts resolved name@version pairs from bun.lock, including scoped packages', () => {
		const packages = resolvedPackages(`{
			"packages": {
				"@types/ws": ["@types/ws@8.18.1", "", {}, "digest"],
				"ws": ["ws@8.21.3", "", {}, "digest"],
				"vite/postcss": ["postcss@8.5.16", "", {}, "digest"]
			}
		}`);

		expect(packages).toContainEqual({ name: '@types/ws', version: '8.18.1', paths: '@types/ws' });
		expect(packages).toContainEqual({ name: 'ws', version: '8.21.3', paths: 'ws' });
		expect(packages).toContainEqual({ name: 'postcss', version: '8.5.16', paths: 'vite/postcss' });
	});

	it('extracts resolved name@version pairs from JSONC bun.lock with comments', () => {
		const lockfile = `// Bun lockfile\n// generated\n{\n\t// root workspace\n\t"packages": {\n\t\t"ws": ["ws@8.21.3", ""], // trailing\n\t\t"postcss": ["postcss@8.5.16", ""]\n\t}\n}`;
		const packages = resolvedPackages(lockfile);
		expect(packages).toContainEqual({ name: 'ws', version: '8.21.3', paths: 'ws' });
		expect(packages).toContainEqual({ name: 'postcss', version: '8.5.16', paths: 'postcss' });
	});

	it('does not treat comment markers inside string values as comments', () => {
		const lockfile = '{"packages":{"ws":["ws@8.21.3","https://example.test/a"]}}';
		expect(resolvedPackages(lockfile)).toEqual([{ name: 'ws', version: '8.21.3', paths: 'ws' }]);
	});

	it('fails after retries on a persistently unreachable OSV API instead of passing silently', async () => {
		const transientFailure = Object.assign(new Error('boom'), { cause: { code: 'ECONNRESET' } });
		const fetchImpl = vi.fn().mockRejectedValue(transientFailure);

		await expect(queryOsv([{ name: "ws", version: "8.21.3" }], fetchImpl as unknown as typeof fetch, { retryDelayMs: 1 })).rejects.toThrow(/refusing to pass/);
		expect(fetchImpl).toHaveBeenCalledTimes(3);
	});

	it('reports vulnerable packages with name, version, path, and advisory', () => {
		const packages = [{ name: 'nanoid', version: '3.3.15', paths: 'nanoid' }];
		const results = {
			results: [{ vulns: [{ id: 'GHSA-xxxx', aliases: ['CVE-2026-0000'], summary: '  insecure generation  ' }] }]
		};

		expect(formatFindings(packages, results)).toEqual([
			{
				package: 'nanoid@3.3.15',
				path: 'nanoid',
				advisory: 'GHSA-xxxx, CVE-2026-0000',
				ids: ['GHSA-xxxx', 'CVE-2026-0000'],
				summary: 'insecure generation'
			}
		]);
	});

	it('fails only on advisories missing from the documented baseline', async () => {
		const fetchImpl = vi.fn().mockResolvedValue({
			ok: true,
			json: () =>
				Promise.resolve({
					results: [
						{ vulns: [{ id: 'GHSA-known', aliases: [], summary: 'known' }] },
						{ vulns: [{ id: 'GHSA-new', aliases: [], summary: 'brand new regression' }] }
					]
				})
		});
		const packages = [
			{ name: 'known-pkg', version: '1.0.0', paths: 'known-pkg' },
			{ name: 'new-pkg', version: '2.0.0', paths: 'new-pkg' }
		];
		const results = await queryOsv(packages, fetchImpl as unknown as typeof fetch);
		const findings = formatFindings(packages, results);
		const baseline = new Set(['GHSA-known']);
		const unknown = findings.filter((finding: { ids: string[] }) => !finding.ids.some((id) => baseline.has(id)));

		expect(unknown).toHaveLength(1);
		expect(unknown[0].package).toBe('new-pkg@2.0.0');
		expect(loadBaseline('/nonexistent/baseline.txt').size).toBe(0);
	});

	it('reports no findings on a clean OSV response for the real bun.lock', async () => {
		const fetchImpl = vi.fn().mockResolvedValue({
			ok: true,
			json: () => Promise.resolve({ results: [] })
		});
		const packages = resolvedPackages();
		const results = await queryOsv(packages, fetchImpl as unknown as typeof fetch);
		expect(packages.length).toBeGreaterThan(0);
		expect(formatFindings(packages, results)).toEqual([]);
	});
});
