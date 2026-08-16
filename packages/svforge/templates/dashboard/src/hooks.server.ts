import type { Handle } from '@sveltejs/kit';
// `building` is used to skip auth during prerender/build (SvelteKit builds pages statically).
import { building } from '$app/environment';
import { getTextDirection } from '$lib/paraglide/runtime';
import { paraglideMiddleware } from '$lib/paraglide/server';
import { auth } from '$lib/server/auth';
import { svelteKitHandler } from 'better-auth/svelte-kit';

const handleParaglide: Handle = ({ event, resolve }) =>
	paraglideMiddleware(event.request, ({ request, locale }) => {
		event.request = request;
		return resolve(event, {
			transformPageChunk: ({ html }) =>
				html
					.replace('%paraglide.lang%', locale)
					.replace('%paraglide.dir%', getTextDirection(locale))
		});
	});

const handleBetterAuth: Handle = async ({ event, resolve }) => {
	const session = await auth.api.getSession({ headers: event.request.headers });

	if (session) {
		event.locals.session = session.session;
		event.locals.user = session.user;
	}

	return svelteKitHandler({ event, resolve, auth, building });
};

// `sequence` is not exported by the @sveltejs/kit runtime in 2.57 (types
// only) — compose the two handles manually. handleBetterAuth MUST run or
// locals.session/locals.user stay undefined and every protected route
// redirects to /login (regression found during #268 screenshots).
export const handle: Handle = async ({ event, resolve }) =>
	paraglideMiddleware(event.request, async ({ request, locale }) => {
		event.request = request;
		return handleBetterAuth({ event, resolve });
	});
