import { describe, it, expect } from 'vitest';
import { join } from 'node:path';

const ROOT = process.cwd();
const WELCOME = join(ROOT, 'packages/email/templates/src/lib/server/templates/welcome.ts');
const RESET = join(ROOT, 'packages/email/templates/src/lib/server/templates/reset-password.ts');
const SECURITY = join(ROOT, 'packages/email/templates/src/lib/server/templates/security.ts');

/**
 * Email template hardening (#297): user-controlled values interpolated into
 * generated HTML must be escaped (name) and scheme-allowlisted (resetUrl).
 */
const { welcomeEmailHtml } = await import(WELCOME);
const { resetPasswordEmailHtml } = await import(RESET);
const { sanitizeHref } = await import(SECURITY);

describe('email template hardening (#297)', () => {
	it('a name containing <script> is escaped, never raw', () => {
		const html = welcomeEmailHtml('<script>alert(1)</script>');
		expect(html).not.toContain('<script>');
		expect(html).toContain('&lt;script&gt;');
	});

	it('a name breaking the markup is escaped (quote breakout)', () => {
		const html = welcomeEmailHtml('Bob" onmouseover="alert(1)');
		// The payload survives ONLY inside escaped attribute text — no raw
		// attribute boundary can be opened.
		expect(html).not.toContain('onmouseover="');
		expect(html).toContain('&quot; onmouseover=&quot;');
	});

	it('a normal name still renders', () => {
		const html = welcomeEmailHtml('Alice & Bob');
		expect(html).toContain('Welcome, Alice &amp; Bob!');
	});

	it('a javascript: resetUrl becomes # (no dangerous href)', () => {
		const html = resetPasswordEmailHtml('javascript:alert(1)');
		expect(html).not.toMatch(/javascript:/i);
		expect(html).toContain('href="#"');
	});

	it('a data: resetUrl becomes #', () => {
		const html = resetPasswordEmailHtml('data:text/html,<script>alert(1)</script>');
		expect(html).toContain('href="#"');
	});

	it('a quote-breakout resetUrl cannot inject attributes', () => {
		const html = resetPasswordEmailHtml('https://ok.example" onmouseover="alert(1)');
		expect(html).not.toContain('onmouseover="');
		expect(html).toContain('&quot;');
	});

	it('a valid https resetUrl is preserved', () => {
		const html = resetPasswordEmailHtml('https://app.example.com/reset?token=abc');
		expect(html).toContain('href="https://app.example.com/reset?token=abc"');
	});

	it('mailto/tel are allowed by sanitizeHref', () => {
		expect(sanitizeHref('mailto:help@example.com')).toBe('mailto:help@example.com');
		expect(sanitizeHref('tel:+3312345')).toBe('tel:+3312345');
	});

	it('protocol-relative //host is refused by sanitizeHref', () => {
		expect(sanitizeHref('//evil.example')).toBe('#');
	});

	it('mixed-case javascript: is refused by sanitizeHref', () => {
		expect(sanitizeHref('JaVaScRiPt:alert(1)')).toBe('#');
	});
});
