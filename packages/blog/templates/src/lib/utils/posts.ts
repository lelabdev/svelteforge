/** Post metadata returned by getAllPosts and getPost. */
export interface PostMeta {
	title: string;
	date: string;
	excerpt: string;
	tags: string[];
	slug: string;
}

/** Full post including rendered HTML content. */
export interface Post extends PostMeta {
	content: string;
}

// Dynamic import of all .md files in src/posts/
const postFiles = import.meta.glob('/src/posts/*.md');

export async function getAllPosts(): Promise<PostMeta[]> {
	const posts = await Promise.all(
		Object.entries(postFiles).map(async ([path, resolver]) => {
			const mod = (await resolver()) as { metadata: PostMeta };
			const slug = path.split('/').pop()!.replace('.md', '');
			return { ...mod.metadata, slug } as PostMeta;
		})
	);
	return posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/** Get a single post by slug, including rendered HTML content. */
export async function getPost(slug: string): Promise<Post | null> {
	const path = `/src/posts/${slug}.md`;
	const resolver = postFiles[path];
	if (!resolver) return null;

	const mod = (await resolver()) as { metadata: PostMeta; default: string };
	return {
		...mod.metadata,
		slug,
		content: mod.default
	};
}
