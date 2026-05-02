import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent }) => {
	const parentData = await parent();

	// Si connecté, on envoie directement au dashboard
	if (parentData.session?.user) {
		const user = parentData.session.user;
		if (user.role === 'admin') {
			redirect(302, '/admin');
		}
		redirect(302, '/dashboard');
	}

	// Non connecté → afficher la landing page
};
