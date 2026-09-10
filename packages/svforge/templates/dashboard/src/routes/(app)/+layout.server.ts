import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

// Auth guard for the (app) route group.
// The (app) group wraps all protected routes — unauthenticated users are redirected to /login
// with a callbackURL so they return here after successful login. — redirects to /login if no session.
// Admin-only sub-routes additionally call isAdmin(): an explicit persisted role (#318),
// never derivable from ordering. Add finer roles on the same column if ever needed.
export const load: LayoutServerLoad = async ({ locals, url }) => {
	if (!locals.session || !locals.user) {
		throw redirect(302, `/login?callbackURL=${encodeURIComponent(url.pathname)}`);
	}

	return {
		user: locals.user,
		session: locals.session
	};
};
