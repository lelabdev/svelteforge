#!/usr/bin/env bun
/**
 * SvelteForge - Interactive setup script
 * Creates .env, initializes database, seeds admin user
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { randomBytes } from 'crypto';
import { execSync } from 'child_process';

function question(prompt: string): Promise<string> {
	return new Promise((resolve) => {
		process.stdout.write(prompt);
		const chunks: Buffer[] = [];
		process.stdin.on('data', (chunk) => {
			chunks.push(chunk);
			const input = Buffer.concat(chunks).toString().trim();
			if (input.includes('\n') || chunk.includes(0x0a)) {
				process.stdin.removeAllListeners('data');
				resolve(input.replace(/\n.*$/, ''));
			}
		});
	});
}

async function main() {
	console.log('\n🛠️  SvelteForge Setup\n');

	// Project name
	const currentName = JSON.parse(readFileSync('package.json', 'utf-8')).name;
	const projectName = (await question(`? Project name (${currentName}): `)) || currentName;

	// Admin credentials
	const adminEmail =
		(await question('? Admin email (admin@example.com): ')) || 'admin@example.com';
	const adminPassword =
		(await question('? Admin password (min 8 chars): ')) || 'admin1234';
	const adminName = (await question(`? Admin name (Admin): `)) || 'Admin';

	// Generate auth secret
	const authSecret = randomBytes(32).toString('hex');
	const baseUrl = (await question('? Base URL (http://localhost:5173): ')) || 'http://localhost:5173';

	// ── .env ──
	const envContent = `# ${projectName}

# Database (SQLite)
DATABASE_URL="data/sqlite.db"

# BetterAuth
BETTER_AUTH_SECRET="${authSecret}"
BASE_URL="${baseUrl}"
`;

	if (!existsSync('.env')) {
		writeFileSync('.env', envContent);
		console.log('✅ Created .env');
	} else {
		console.log('⚠️  .env already exists, skipping');
	}

	// ── .env.example ──
	if (!existsSync('.env.example')) {
		writeFileSync(
			'.env.example',
			`# ${projectName}

# Database (SQLite)
DATABASE_URL="data/sqlite.db"

# BetterAuth
BETTER_AUTH_SECRET="change-me-in-production"
BASE_URL="http://localhost:5173"
`
		);
		console.log('✅ Created .env.example');
	}

	// ── package.json ──
	const pkg = JSON.parse(readFileSync('package.json', 'utf-8'));
	pkg.name = projectName;
	writeFileSync('package.json', JSON.stringify(pkg, null, '\t') + '\n');
	console.log(`✅ Updated package.json name to "${projectName}"`);

	// ── data/ directory ──
	if (!existsSync('data')) {
		mkdirSync('data', { recursive: true });
		console.log('✅ Created data/ directory');
	}

	// ── Install dependencies ──
	console.log('\n📦 Installing dependencies...');
	try {
		execSync('bun install', { stdio: 'inherit' });
		console.log('✅ Dependencies installed');
	} catch {
		console.log('⚠️  bun install failed. Run manually: bun install');
	}

	// ── Push DB schema ──
	console.log('\n🗄️  Initializing database...');
	try {
		execSync('bun run db:push', { stdio: 'pipe' });
		console.log('✅ Database schema created');
	} catch {
		console.log('⚠️  db:push failed. Run manually: bun run db:push');
	}

	// ── Seed admin user ──
	console.log('\n👤 Creating admin user...');
	try {
		// Use a temp script to create admin via BetterAuth
		const seedScript = `
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { admin } from 'better-auth/plugins';
import { Database } from 'bun:sqlite';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import * as schema from './src/lib/db/schemas';

const sqlite = new Database('data/sqlite.db');
const db = drizzle(sqlite, { schema });

const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: 'sqlite',
		schema: { user: schema.user, session: schema.session, account: schema.account, verification: schema.verification }
	}),
	emailAndPassword: { enabled: true },
	plugins: [admin({ adminUserIds: [] })],
	baseURL: '${baseUrl}',
	secret: '${authSecret}'
});

const result = await auth.api.signUpEmail({
	body: { email: '${adminEmail}', password: '${adminPassword}', name: '${adminName}' }
});

if (result.user) {
	// Make first user admin
	const { eq } = await import('drizzle-orm');
	await db.update(schema.user).set({ role: 'admin', emailVerified: true, updatedAt: new Date() }).where(eq(schema.user.id, result.user.id));
	console.log('✅ Admin user created: ${adminEmail}');
} else {
	console.error('❌ Failed to create admin user');
	process.exit(1);
}

sqlite.close();
`;
		writeFileSync('/tmp/svelteforge-seed.ts', seedScript);
		execSync('bun run /tmp/svelteforge-seed.ts', { stdio: 'inherit' });
	} catch (e) {
		console.log('⚠️  Could not seed admin automatically.');
		console.log('   Run `bun dev` then sign up manually — first user becomes admin.');
	}

	// ── Git ──
	if (!existsSync('.git')) {
		try {
			execSync('git init', { stdio: 'pipe' });
			console.log('✅ Initialized git repository');
		} catch {
			console.log('⚠️  git init failed');
		}
	}

	console.log('\n✨ Setup complete!\n');
	console.log('Next steps:');
	console.log('  bun dev');
	console.log(`  Open ${baseUrl} and log in with ${adminEmail}\n`);
}

main().catch(console.error);
