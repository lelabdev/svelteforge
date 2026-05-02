/**
 * account/index.ts - Barrel file for the account module
 *
 * Re-exports all functions and types from sub-modules.
 */

// ===== CORE - Shared functions =====
export * from './core';

// ===== MANAGEMENT - Admin account management =====
export * from './management';

// ===== ROLES - Role management and validation =====
export * from './roles';

// ===== UPDATES - User data updates =====
export * from './updates';
