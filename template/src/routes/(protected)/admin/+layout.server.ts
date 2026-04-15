import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

interface UserWithRole {
	id: string;
	email: string;
	name: string;
	role: string | null;
}

export const load: LayoutServerLoad = async ({ parent }) => {
	const parentData = await parent();

	if (!parentData.session?.user) {
		redirect(302, '/login');
	}

	const session = parentData.session;
	const user = session.user as unknown as UserWithRole;

	if (user.role !== 'admin') {
		redirect(302, '/dashboard');
	}

	return {
		session
	};
};
