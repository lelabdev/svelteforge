import { pgTable, uuid, text, jsonb, timestamp } from 'drizzle-orm/pg-core';

/**
 * Notification schema (#230) — persistent business notifications.
 * Distinct from ui_toast: a notification is USER DATA with history and
 * read/unread state. `message` is plain text (no arbitrary HTML in v1).
 */
export const notifications = pgTable('notifications', {
	id: uuid('id').primaryKey().defaultRandom(),
	userId: text('user_id').notNull(),
	type: text('type').notNull(),
	title: text('title').notNull(),
	message: text('message').notNull(),
	actionUrl: text('action_url'),
	metadata: jsonb('metadata').$type<Record<string, unknown>>(),
	readAt: timestamp('read_at', { withTimezone: true }),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});
