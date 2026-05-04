import { createAuthClient } from 'better-auth/svelte';
import { adminClient } from 'better-auth/client/plugins';

export const authClient = createAuthClient({
	baseURL: typeof window !== 'undefined'
		? window.location.origin
		: (import.meta.env?.ORIGIN || 'http://localhost:5173'),
	plugins: [adminClient()]
});
