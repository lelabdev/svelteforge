#!/usr/bin/env bun
/**
 * Reset local development database
 * - Deletes sqlite.db and recreates it with schema
 */

import { unlinkSync, existsSync, mkdirSync } from 'fs';
import { resolve } from 'path';
import { execSync } from 'child_process';

const workingDbPath = resolve('data/sqlite.db');

console.log('🔄 Resetting local database...\n');

// Ensure data directory exists
mkdirSync('data', { recursive: true });

// Delete existing working DB
if (existsSync(workingDbPath)) {
	console.log(`🗑️  Deleting existing ${workingDbPath}...`);
	unlinkSync(workingDbPath);
	console.log('✅ Database deleted\n');
}

// Push schema to create fresh DB
console.log('📦 Pushing schema to fresh database...');
execSync(`DATABASE_URL="${workingDbPath}" bunx drizzle-kit push`, { stdio: 'inherit' });

console.log('\n✅ Database reset complete!');
console.log(`   ${workingDbPath} is now fresh and ready\n`);
