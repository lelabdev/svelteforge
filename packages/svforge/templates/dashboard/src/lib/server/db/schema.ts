import { pgTable, uuid, text, integer, timestamp } from 'drizzle-orm/pg-core';

export const task = pgTable('task', {
	id: uuid('id').primaryKey().defaultRandom(),
	title: text('title').notNull(),
	priority: integer('priority').notNull().default(1)
});

/**
 * Sign-up invitations (#318) — the `invite-only` sign-up mode.
 *
 * App-level table (NOT part of the Better Auth model — keep it out of
 * auth.schema.ts, the runtime schema gate would flag it). One pre-approved
 * email per row; consumed ONCE by the sign-up hook in auth.ts via the atomic
 * conditional update in invitations.ts.
 */
export const invitation = pgTable('invitation', {
	id: uuid('id').primaryKey().defaultRandom(),
	email: text('email').notNull().unique(),
	acceptedAt: timestamp('accepted_at', { withTimezone: true }),
	expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

export * from './auth.schema';
