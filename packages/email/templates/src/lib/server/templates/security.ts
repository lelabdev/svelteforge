/**
 * Shared HTML-safety helpers for the email templates (#297).
 *
 * The templates interpolate user-controlled values (display name, reset URL)
 * into generated HTML — without escaping, a crafted `name` or `resetUrl`
 * could break the markup or produce a `javascript:` href. These helpers keep
 * the templates dead simple (no templating engine) while closing the holes:
 *
 * - escapeHtml: HTML-escapes text content (`& < > " '`).
 * - sanitizeHref: allows http/https/mailto/tel and safe relative URLs only;
 *   any other scheme (javascript:, data:, …) and protocol-relative //host
 *   URLs are replaced with '#' (same policy as the Tiptap renderer).
 */

const SAFE_PROTOCOLS = ['http:', 'https:', 'mailto:', 'tel:'];

/** Escape HTML special characters to prevent injection. */
export function escapeHtml(text: string): string {
	return text
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

/** Sanitize an href for interpolation inside an email anchor. */
export function sanitizeHref(href: unknown): string {
	if (typeof href !== 'string') return '#';
	const value = href.trim();
	if (!value) return '#';

	const scheme = /^([a-zA-Z][a-zA-Z0-9+.-]*):/.exec(value)?.[1]?.toLowerCase();
	if (scheme) {
		return SAFE_PROTOCOLS.includes(`${scheme}:`) ? escapeHtml(value) : '#';
	}

	// Protocol-relative URLs inherit the scheme of the email client's origin —
	// ambiguous and unsafe for external links inside emails.
	if (value.startsWith('//')) return '#';

	// Safe relative URL (unlikely in emails, but harmless to allow).
	return escapeHtml(value);
}
