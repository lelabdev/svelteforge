import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

// Auth guard — redirects to /login if no session.
// This template uses single-admin pattern (first user is admin).
// For multi-user, add a role column and check here.
export const load: LayoutServerLoad = async ({ locals, url }) => {
	if (!locals.session || !locals.user) {
		throw redirect(302, `/login?callbackURL=${encodeURIComponent(url.pathname)}`);
	}

	return {
		user: locals.user,
		session: locals.session
	};
};
