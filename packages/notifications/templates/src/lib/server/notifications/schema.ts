import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

/**
 * Notification schema (#230) — persistent business notifications.
 * Distinct from ui_toast: a notification is USER DATA with history and
 * read/unread state. `message` is plain text (no arbitrary HTML in v1).
 */
export const notifications = sqliteTable('notifications', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	userId: text('user_id').notNull(),
	type: text('type').notNull(),
	title: text('title').notNull(),
	message: text('message').notNull(),
	actionUrl: text('action_url'),
	metadata: text('metadata', { mode: 'json' }).$type<Record<string, unknown>>(),
	readAt: integer('read_at', { mode: 'timestamp' }),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
});
