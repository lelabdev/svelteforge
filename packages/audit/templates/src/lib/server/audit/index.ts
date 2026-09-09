import { db } from '$lib/server/db';
import { auditLogs } from './schema';
import { desc, eq, and, lt } from 'drizzle-orm';
import { env } from '$env/dynamic/private';
import { retentionCutoff } from './retention';
import { redactMetadata, resolvePiiMode } from './pii';

/**
 * SvelteForge audit trail (#232) — append-only business action logging.
 *
 *   await audit.record({
 *     actorId: user.id,
 *     action: 'punch.corrected',
 *     entityType: 'punch',
 *     entityId: punch.id,
 *     metadata: { before: { time: oldTime }, after: { time: newTime }, reason }
 *   });
 *
 * Reads:
 *   await audit.forEntity('punch', punchId);
 *   await audit.byActor(userId, { limit: 50 });
 */

export interface AuditEntryInput {
	actorId?: string | null;
	action: string;
	entityType: string;
	entityId?: string | null;
	metadata?: Record<string, unknown>;
	ipAddress?: string | null;
	userAgent?: string | null;
}

export interface AuditListOptions {
	limit?: number;
	offset?: number;
}

export interface AuditFilters extends AuditListOptions {
	action?: string;
	entityType?: string;
}

export const audit = {
	/** Append an audit entry. Never updates/deletes existing rows. */
	async record(input: AuditEntryInput): Promise<typeof auditLogs.$inferSelect> {
		// PII policy (#332): AUDIT_PII_MODE=redact strips PII metadata keys and
		// nulls the PII columns before insert. Default is 'keep' — see pii.ts.
		const mode = resolvePiiMode(env.AUDIT_PII_MODE);
		const metadata = mode === 'redact' && input.metadata ? redactMetadata(input.metadata).clean : (input.metadata ?? {});
		const ipAddress = mode === 'redact' ? null : (input.ipAddress ?? null);
		const userAgent = mode === 'redact' ? null : (input.userAgent ?? null);
		const [row] = await db
			.insert(auditLogs)
			.values({
				actorId: input.actorId ?? null,
				action: input.action,
				entityType: input.entityType,
				entityId: input.entityId ?? null,
				metadata,
				ipAddress,
				userAgent,
				createdAt: new Date()
			})
			.returning();
		return row;
	},

	/**
	 * The ONLY sanctioned delete path (#332): delete rows older than the
	 * retention period. Sources the period from AUDIT_RETENTION_DAYS unless an
	 * explicit `days` is passed. Without a retention policy this is a no-op —
	 * the log is kept forever. With append-only.sql applied, purging requires
	 * the documented maintenance window (see append-only.sql).
	 */
	async purgeExpired(options: { days?: number; now?: Date } = {}): Promise<{ purged: boolean; deleted: number }> {
		const cutoff = options.days !== undefined ? retentionCutoff(String(options.days), options.now) : retentionCutoff(env.AUDIT_RETENTION_DAYS, options.now);
		if (cutoff === null) return { purged: false, deleted: 0 };
		const deleted = await db.delete(auditLogs).where(lt(auditLogs.createdAt, cutoff)).returning({ id: auditLogs.id });
		return { purged: true, deleted: deleted.length };
	},

	/** Full history for one entity (newest first). */
	async forEntity(entityType: string, entityId: string, opts: AuditListOptions = {}): Promise<typeof auditLogs.$inferSelect[]> {
		return db
			.select()
			.from(auditLogs)
			.where(and(eq(auditLogs.entityType, entityType), eq(auditLogs.entityId, entityId)))
			.orderBy(desc(auditLogs.createdAt))
			.limit(opts.limit ?? 50)
			.offset(opts.offset ?? 0);
	},

	/** Actions by one actor (newest first). */
	async byActor(actorId: string, opts: AuditListOptions = {}): Promise<typeof auditLogs.$inferSelect[]> {
		return db
			.select()
			.from(auditLogs)
			.where(eq(auditLogs.actorId, actorId))
			.orderBy(desc(auditLogs.createdAt))
			.limit(opts.limit ?? 50)
			.offset(opts.offset ?? 0);
	},

	/** Recent actions with optional filters (admin view). */
	async list(filters: AuditFilters = {}): Promise<typeof auditLogs.$inferSelect[]> {
		const conditions = [];
		if (filters.action) conditions.push(eq(auditLogs.action, filters.action));
		if (filters.entityType) conditions.push(eq(auditLogs.entityType, filters.entityType));
		const where = conditions.length ? and(...conditions) : undefined;
		const q = db.select().from(auditLogs);
		if (where) q.where(where);
		return q.orderBy(desc(auditLogs.createdAt)).limit(filters.limit ?? 50).offset(filters.offset ?? 0);
	}
};
