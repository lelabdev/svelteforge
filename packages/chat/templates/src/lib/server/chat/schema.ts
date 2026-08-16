import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

/**
 * Chat schema (#233) — conversations, participants, messages, read-state.
 * Security: memberships are the source of truth; the service layer enforces
 * them server-side on every read/write.
 */
export const conversations = sqliteTable('conversations', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	type: text('type', { enum: ['direct', 'group'] }).notNull().default('direct'),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
});

export const conversationParticipants = sqliteTable('conversation_participants', {
	conversationId: integer('conversation_id').notNull().references(() => conversations.id, { onDelete: 'cascade' }),
	userId: text('user_id').notNull(),
	joinedAt: integer('joined_at', { mode: 'timestamp' }).notNull()
});

export const messages = sqliteTable('messages', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	conversationId: integer('conversation_id').notNull().references(() => conversations.id, { onDelete: 'cascade' }),
	authorId: text('author_id').notNull(),
	content: text('content').notNull(),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
});

export const messageReads = sqliteTable('message_reads', {
	messageId: integer('message_id').notNull().references(() => messages.id, { onDelete: 'cascade' }),
	userId: text('user_id').notNull(),
	readAt: integer('read_at', { mode: 'timestamp' }).notNull()
});
