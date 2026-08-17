import type { Component } from 'svelte';

/** Post metadata returned by getAllPosts and getPost. */
export interface PostMeta {
	title: string;
	date: string;
	excerpt: string;
	tags: string[];
	slug: string;
}

/**
 * MDsveX compiles a Markdown document into a Svelte COMPONENT (a function).
 * A function cannot cross the SvelteKit data boundary, so `PostComponent`
 * wraps the real component together with its slug:
 *
 *   - on the SERVER the page renders `post.content.component` directly
 *     (`<svelte:component this={...} />`), no `{@html}`, no cast to string;
 *   - the transport hook in `src/hooks.ts` (installed with this module)
 *     encodes the wrapper as its slug for the client payload and re-imports
 *     the compiled component on the browser via the same import.meta.glob.
 */
export class PostComponent {
	readonly __brand = 'mdx-post';
	constructor(
		readonly component: Component,
		readonly slug: string
	) {}
}

/** Full post: metadata + the MDsveX component wrapper. */
export interface Post extends PostMeta {
	content: PostComponent;
}

// Dynamic import of all .md files in src/posts/ — the single source of truth
// used by the server (load), the client (transport decode) and the list page.
const postFiles = import.meta.glob('/src/posts/*.md');

/** Resolve the compiled MDsveX component of a post by slug. */
export async function loadPostComponent(slug: string): Promise<Component | null> {
	const resolver = postFiles[`/src/posts/${slug}.md`];
	if (!resolver) return null;
	const mod = (await resolver()) as { default: Component };
	return mod.default ?? null;
}

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

/** Get a single post by slug, including the MDsveX component wrapper. */
export async function getPost(slug: string): Promise<Post | null> {
	const path = `/src/posts/${slug}.md`;
	const resolver = postFiles[path];
	if (!resolver) return null;

	const mod = (await resolver()) as { metadata: PostMeta; default: Component };
	return {
		...mod.metadata,
		slug,
		content: new PostComponent(mod.default, slug)
	};
}
