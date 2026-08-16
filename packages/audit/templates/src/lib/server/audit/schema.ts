import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

/**
 * Audit log schema (#232) — append-only at the application level.
 * There is NO update/delete path exposed by the API.
 *
 * `metadata` is for structured context (before/after, reason). NEVER store:
 * passwords, tokens, full object dumps of sensitive data, PII beyond what the
 * feature genuinely needs. See README.
 */
export const auditLogs = sqliteTable('audit_logs', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	actorId: text('actor_id'), // nullable → system action
	action: text('action').notNull(),
	entityType: text('entity_type').notNull(),
	entityId: text('entity_id'),
	metadata: text('metadata', { mode: 'json' }).$type<Record<string, unknown>>(),
	ipAddress: text('ip_address'),
	userAgent: text('user_agent'),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
});
