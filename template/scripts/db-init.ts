#!/usr/bin/env bun
/**
 * Initialize database with schema only
 * Creates a fresh SQLite database using Drizzle schema
 */

import { execSync } from 'child_process';
import { mkdirSync } from 'fs';
import { resolve } from 'path';

const dbPath = resolve('data/sqlite.db');

console.log('🔧 Initializing database with schema...\n');

// Ensure data directory exists
mkdirSync('data', { recursive: true });

// Push schema to create DB
console.log(`📦 Pushing schema to ${dbPath}...`);
execSync(`DATABASE_URL="${dbPath}" bunx drizzle-kit push`, { stdio: 'inherit' });

console.log('\n✅ Database initialized!');
console.log(`   Schema only, no data`);
console.log(`   Location: ${dbPath}\n`);
console.log('💡 Next steps:');
console.log('   - Run "bun dev" to start the dev server');
console.log('   - Open /install to create your admin account\n');
