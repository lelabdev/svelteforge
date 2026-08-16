import { pgTable, uuid, text, timestamp, primaryKey } from 'drizzle-orm/pg-core';

/**
 * Chat schema (#233) — conversations, participants, messages, read-state.
 * Security: memberships are the source of truth; the service layer enforces
 * them server-side on every read/write.
 *
 * Composite primary keys on membership/read tables guarantee uniqueness
 * and are required by PostgreSQL on join tables.
 */
export const conversations = pgTable('conversations', {
	id: uuid('id').primaryKey().defaultRandom(),
	type: text('type', { enum: ['direct', 'group'] }).notNull().default('direct'),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

export const conversationParticipants = pgTable(
	'conversation_participants',
	{
		conversationId: uuid('conversation_id')
			.notNull()
			.references(() => conversations.id, { onDelete: 'cascade' }),
		userId: text('user_id').notNull(),
		joinedAt: timestamp('joined_at', { withTimezone: true }).notNull().defaultNow()
	},
	(table) => [primaryKey({ columns: [table.conversationId, table.userId] })]
);

export const messages = pgTable('messages', {
	id: uuid('id').primaryKey().defaultRandom(),
	conversationId: uuid('conversation_id')
		.notNull()
		.references(() => conversations.id, { onDelete: 'cascade' }),
	authorId: text('author_id').notNull(),
	content: text('content').notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

export const messageReads = pgTable(
	'message_reads',
	{
		messageId: uuid('message_id')
			.notNull()
			.references(() => messages.id, { onDelete: 'cascade' }),
		userId: text('user_id').notNull(),
		readAt: timestamp('read_at', { withTimezone: true }).notNull().defaultNow()
	},
	(table) => [primaryKey({ columns: [table.messageId, table.userId] })]
);
