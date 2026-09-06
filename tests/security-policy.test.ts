import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();

describe('security policy (#352)', () => {
	const policy = readFileSync(join(ROOT, 'SECURITY.md'), 'utf8');
	const readme = readFileSync(join(ROOT, 'README.md'), 'utf8');

	it('exists at the GitHub-recognized repository root', () => {
		expect(policy).toBeTruthy();
	});

	it('routes reporters to GitHub private vulnerability reporting, never public issues', () => {
		expect(policy).toContain('https://github.com/lelabdev/svelteforge/security/advisories/new');
		expect(policy).toMatch(/Do NOT open a public GitHub issue/i);
	});

	it('declares supported versions explicitly', () => {
		expect(policy).toMatch(/latest published version/i);
		expect(policy).toMatch(/Supported/);
	});

	it('sets acknowledgement, update, and fix targets', () => {
		expect(policy).toMatch(/72 hours/);
		expect(policy).toMatch(/every 7 days/);
		expect(policy).toMatch(/≤ 30 days/);
		expect(policy).toMatch(/90 days/);
	});

	it('covers coordinated disclosure and safe harbor', () => {
		expect(policy).toMatch(/coordinated disclosure/i);
		expect(policy).toMatch(/safe harbor/i);
	});

	it('guides on leaked credentials and generated-project vulnerabilities', () => {
		expect(policy).toMatch(/Leaked credentials and secrets/i);
		expect(policy).toMatch(/Vulnerabilities affecting generated projects/i);
		expect(policy).toMatch(/report here/);
		expect(policy).toMatch(/not[\s\S]*an SVForge issue/);
	});

	it('is linked from the README before packages are broadly published', () => {
		expect(readme).toContain('## Security');
		expect(readme).toContain('SECURITY.md');
		expect(readme).toContain('security/advisories/new');
	});
});
