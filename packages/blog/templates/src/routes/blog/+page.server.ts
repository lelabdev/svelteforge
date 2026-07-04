import { getAllPosts } from '$lib/utils/posts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
return { posts: await getAllPosts() };
};
