interface SitemapEntry {
	path: string;
	lastmod?: string;
	changefreq?: string;
	priority?: number;
}

export function generateSitemap(baseUrl: string, routes: SitemapEntry[]): string {
	const entries = routes
		.map((route) => {
			const loc = `${baseUrl}${route.path}`;
			let xml = `  <url>\n    <loc>${loc}</loc>`;
			if (route.lastmod) xml += `\n    <lastmod>${route.lastmod}</lastmod>`;
			if (route.changefreq) xml += `\n    <changefreq>${route.changefreq}</changefreq>`;
			if (route.priority !== undefined) xml += `\n    <priority>${route.priority}</priority>`;
			xml += '\n  </url>';
			return xml;
		})
		.join('\n');

	return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</urlset>`;
}
