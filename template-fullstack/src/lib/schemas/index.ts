/**
 * Zod validation schemas for Superforms
 *
 * This directory contains all validation schemas used in the application.
 * Schemas are organized by domain.
 *
 * Usage:
 * ```typescript
 * import { loginSchema } from '$lib/schemas';
 * import { superValidate } from 'sveltekit-superforms';
 * import { zod4 } from 'sveltekit-superforms/adapters';
 *
 * const form = await superValidate(request, zod4(loginSchema));
 * ```
 */

export * from './account';
export * from './signup';
export * from './login';
export * from './password';
export * from './profile';
