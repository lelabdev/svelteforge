import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

/**
 * Jobs schema (#231) — background job foundation.
 * States: queued → running → completed | failed. Retries bounded.
 */
export const jobs = sqliteTable('jobs', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	type: text('type').notNull(),
	status: text('status', { enum: ['queued', 'running', 'completed', 'failed'] }).notNull().default('queued'),
	payload: text('payload', { mode: 'json' }).$type<Record<string, unknown>>().notNull(),
	progress: integer('progress').notNull().default(0),
	attempts: integer('attempts').notNull().default(0),
	maxAttempts: integer('max_attempts').notNull().default(3),
	result: text('result', { mode: 'json' }).$type<Record<string, unknown>>(),
	error: text('error'),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
	startedAt: integer('started_at', { mode: 'timestamp' }),
	finishedAt: integer('finished_at', { mode: 'timestamp' })
});
