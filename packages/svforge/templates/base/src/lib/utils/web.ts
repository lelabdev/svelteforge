const INTERNAL_ORIGIN = 'https://svelteforge.local';

/** Returns a normalized in-app path, or null when a callback could leave the app. */
export function normalizeInternalCallback(callback: string | null): string | null {
	if (!callback || !callback.startsWith('/') || callback.startsWith('//') || callback.includes('\\')) {
		return null;
	}

	let decoded = callback;
	try {
		// Decode twice so both encoded and double-encoded protocol-relative paths are rejected.
		decoded = decodeURIComponent(decodeURIComponent(callback));
	} catch {
		return null;
	}

	if (!decoded.startsWith('/') || decoded.startsWith('//') || decoded.includes('\\')) return null;

	const url = new URL(callback, INTERNAL_ORIGIN);
	return `${url.pathname}${url.search}${url.hash}`;
}

/** Resolves relative SEO values against the current page so crawlers receive absolute URLs. */
export function resolveAbsoluteUrl(value: string | undefined, pageUrl: string): string {
	return new URL(value ?? pageUrl, pageUrl).href;
}
