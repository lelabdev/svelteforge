import { PUBLIC_POSTS_DIR } from '$env/static/public';
// Fallback: posts are in src/posts/ relative to project root
const POSTS_DIR = 'src/posts';

export interface PostMeta {
title: string;
date: string;
excerpt: string;
tags: string[];
slug: string;
}

// Dynamic import of all .md files in src/posts/
const postFiles = import.meta.glob('/src/posts/*.md');

export async function getAllPosts(): Promise<PostMeta[]> {
const posts = await Promise.all(
Object.entries(postFiles).map(async ([path, resolver]) => {
const mod = await resolver() as any;
const slug = path.split('/').pop()!.replace('.md', '');
return { ...mod.metadata, slug } as PostMeta;
})
);
return posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function getPost(slug: string) {
const posts = await getAllPosts();
return posts.find(p => p.slug === slug);
}
