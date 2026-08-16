import { db } from '$lib/server/db';
import { jobs } from './schema';
import { eq, and, inArray } from 'drizzle-orm';

/**
 * SvelteForge jobs foundation (#231) — background tasks without coupling the
 * business to a queue provider (BullMQ/Redis/etc.).
 *
 *   await jobs.enqueue('payroll.export', { organizationId, period });
 *   jobs.define('payroll.export', async (payload, ctx) => {
 *     await ctx.progress(10);
 *     // long work
 *     await ctx.progress(100);
 *     return { fileId };
 *   });
 *
 * Guarantees (v1): at-least-once (a crashed handler may re-run → handlers must
 * be idempotent), bounded retries (maxAttempts, default 3), no infinite retry.
 */

export type JobStatus = 'queued' | 'running' | 'completed' | 'failed';

export interface JobHandlerContext {
	jobId: number;
	/** Update progress 0–100. */
	progress: (value: number) => Promise<void>;
}

export type JobHandler<T = Record<string, unknown>> = (payload: T, ctx: JobHandlerContext) => Promise<unknown>;

const handlers = new Map<string, JobHandler>();

/** Register a typed handler for a job type. */
export function define<T = Record<string, unknown>>(type: string, handler: JobHandler<T>): void {
	handlers.set(type, handler as JobHandler);
}

export const jobsApi = {
	/** Enqueue a job. Returns immediately (processing happens in background). */
	async enqueue(type: string, payload: Record<string, unknown> = {}, maxAttempts = 3) {
		const [row] = await db
			.insert(jobs)
			.values({
				type,
				status: 'queued',
				payload,
				maxAttempts,
				createdAt: new Date(),
				updatedAt: new Date()
			})
			.returning();
		return row;
	},

	/** Progress update (0–100). */
	async progress(jobId: number, value: number) {
		await db
			.update(jobs)
			.set({ progress: Math.min(100, Math.max(0, value)), updatedAt: new Date() })
			.where(eq(jobs.id, jobId));
	},

	/** Get a job by id (diagnostics). */
	async get(jobId: number) {
		const [row] = await db.select().from(jobs).where(eq(jobs.id, jobId));
		return row;
	},

	/**
	 * Run queued jobs (process one batch). Called by the runner — see
	 * `runner.ts`. Exposed for tests and manual triggering.
	 */
	async processNextBatch(batchSize = 10): Promise<number> {
		const queued = await db
			.select()
			.from(jobs)
			.where(eq(jobs.status, 'queued'))
			.limit(batchSize);
		let processed = 0;
		for (const job of queued) {
			const handler = handlers.get(job.type);
			if (!handler) {
				await db
					.update(jobs)
					.set({ status: 'failed', error: 'Unknown handler', updatedAt: new Date(), finishedAt: new Date() })
					.where(eq(jobs.id, job.id));
				continue;
			}
			await this.runOne(job.id, handler);
			processed++;
		}
		return processed;
	},

	async runOne(jobId: number, handler: JobHandler) {
		const job = await this.get(jobId);
		if (!job) return;
		const attempts = job.attempts + 1;
		await db
			.update(jobs)
			.set({ status: 'running', attempts, startedAt: new Date(), updatedAt: new Date() })
			.where(eq(jobs.id, jobId));
		try {
			const result = await handler(job.payload as Record<string, unknown>, {
				jobId,
				progress: (v) => this.progress(jobId, v)
			});
			await db
				.update(jobs)
				.set({ status: 'completed', progress: 100, result: (result ?? {}) as Record<string, unknown>, finishedAt: new Date(), updatedAt: new Date() })
				.where(eq(jobs.id, jobId));
		} catch (e) {
			const message = e instanceof Error ? e.message : String(e);
			const failed = attempts >= job.maxAttempts;
			await db
				.update(jobs)
				.set({
					status: failed ? 'failed' : 'queued',
					error: message,
					updatedAt: new Date(),
					...(failed ? { finishedAt: new Date() } : {})
				})
				.where(eq(jobs.id, jobId));
		}
	}
};
