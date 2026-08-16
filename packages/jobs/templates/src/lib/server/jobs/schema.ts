import { pgTable, uuid, text, jsonb, integer, timestamp } from 'drizzle-orm/pg-core';

/**
 * Jobs schema (#231) — background job foundation.
 * States: queued → running → completed | failed. Retries bounded.
 */
export const jobs = pgTable('jobs', {
	id: uuid('id').primaryKey().defaultRandom(),
	type: text('type').notNull(),
	status: text('status', { enum: ['queued', 'running', 'completed', 'failed'] })
		.notNull()
		.default('queued'),
	payload: jsonb('payload').$type<Record<string, unknown>>().notNull(),
	progress: integer('progress').notNull().default(0),
	attempts: integer('attempts').notNull().default(0),
	maxAttempts: integer('max_attempts').notNull().default(3),
	result: jsonb('result').$type<Record<string, unknown>>(),
	error: text('error'),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
	startedAt: timestamp('started_at', { withTimezone: true }),
	finishedAt: timestamp('finished_at', { withTimezone: true })
});
