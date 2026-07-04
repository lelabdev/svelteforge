import { getAllPosts } from '$lib/utils/posts';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
const posts = await getAllPosts();
const post = posts.find(p => p.slug === params.slug);
if (!post) throw error(404, 'Post not found');
return { post };
};
