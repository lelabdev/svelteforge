import { pgTable, uuid, text, integer } from 'drizzle-orm/pg-core';

export const task = pgTable('task', {
	id: uuid('id').primaryKey().defaultRandom(),
	title: text('title').notNull(),
	priority: integer('priority').notNull().default(1)
});

export * from './auth.schema';
