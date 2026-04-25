#!/usr/bin/env bun
/**
 * SvelteForge - Interactive setup script
 * Creates .env and initializes database
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
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

	// Generate auth secret (BetterAuth recommends: openssl rand -base64 32)
	let authSecret: string;
	try {
		authSecret = execSync('openssl rand -base64 32', { encoding: 'utf-8' }).trim();
	} catch {
		// Fallback si openssl pas dispo
		const { randomBytes } = await import('crypto');
		authSecret = randomBytes(32).toString('base64');
	}
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
BETTER_AUTH_SECRET="generate-with-openssl-rand-base64-32"
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
	console.log(`  Open ${baseUrl}\n`);
}

main().catch(console.error);
