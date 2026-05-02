/**
 * Shared database types
 *
 * This file provides shared types for database operations.
 *
 * QueryRunner uses a minimal interface to describe the methods actually used
 * across the codebase (select, insert, update, delete, transaction).
 * At runtime, both the db instance and Drizzle transaction runners satisfy this interface.
 */

/**
 * Type for transaction or database connection
 * Accepts both the regular db instance and Drizzle transaction runners
 *
 * @example
 * ```ts
 * import { db } from '$lib/db';
 * import type { QueryRunner } from '$lib/db/types';
 *
 * export async function myFunction(tx?: QueryRunner) {
 *   const queryRunner = tx || db;
 *   return await queryRunner.select().from(users);
 * }
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type QueryRunner = any;
