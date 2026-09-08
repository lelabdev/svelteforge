interface SitemapEntry {
	path: string;
	lastmod?: string;
	changefreq?: string;
	priority?: number;
}

const CHANGE_FREQUENCIES = new Set(['always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never']);
const MAX_TEXT_LENGTH = 2_048;

function escapeXml(value: string): string {
	return value.replace(/[&<>"']/g, (character) => ({
		'&': '&amp;',
		'<': '&lt;',
		'>': '&gt;',
		'"': '&quot;',
		"'": '&apos;'
	})[character]!);
}

function boundedText(value: string | undefined): string | undefined {
	return value && value.length <= MAX_TEXT_LENGTH ? value : undefined;
}

export function generateSitemap(baseUrl: string, routes: SitemapEntry[]): string {
	const safeBaseUrl = boundedText(baseUrl) ?? '';
	const entries = routes
		.map((route) => {
			const path = boundedText(route.path) ?? '/';
			const loc = escapeXml(`${safeBaseUrl}${path}`);
			let xml = `  <url>\n    <loc>${loc}</loc>`;
			const lastmod = boundedText(route.lastmod);
			if (lastmod) xml += `\n    <lastmod>${escapeXml(lastmod)}</lastmod>`;
			if (route.changefreq && CHANGE_FREQUENCIES.has(route.changefreq)) {
				xml += `\n    <changefreq>${escapeXml(route.changefreq)}</changefreq>`;
			}
			if (typeof route.priority === 'number' && route.priority >= 0 && route.priority <= 1) {
				xml += `\n    <priority>${route.priority}</priority>`;
			}
			xml += '\n  </url>';
			return xml;
		})
		.join('\n');

	return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</urlset>`;
}
