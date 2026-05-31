import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { user, session } from '$lib/server/db/schema';
import { sql, desc, asc } from 'drizzle-orm';
import { isAdmin } from '$lib/server/admin';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user || !(await isAdmin(locals.user.id))) {
		throw redirect(302, '/login');
	}

	const [totalUsersResult] = await db.select({ count: sql<number>`count(*)` }).from(user);
	const [activeSessionsResult] = await db.select({ count: sql<number>`count(*)` }).from(session).where(sql`expires_at > ${Date.now()}`);
	const [newThisWeekResult] = await db.select({ count: sql<number>`count(*)` }).from(user).where(sql`created_at > ${Date.now() - 7 * 24 * 60 * 60 * 1000}`);

	const recentUsers = await db.select({
		id: user.id,
		name: user.name,
		email: user.email,
		emailVerified: user.emailVerified,
		createdAt: user.createdAt
	}).from(user).orderBy(desc(user.createdAt)).limit(5);

	return {
		user: locals.user,
		stats: {
			totalUsers: totalUsersResult?.count ?? 0,
			activeSessions: activeSessionsResult?.count ?? 0,
			newThisWeek: newThisWeekResult?.count ?? 0
		},
		recentUsers
	};
};
