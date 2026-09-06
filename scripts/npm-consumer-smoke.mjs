#!/usr/bin/env node
/**
 * Install the exact release-plan versions in a clean consumer and verify that
 * every package exposes the declared TypeScript entry point.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';

export function packageTypePath(manifest) {
	const rootExport = manifest.exports?.['.'] ?? manifest.exports;
	if (rootExport && typeof rootExport === 'object' && typeof rootExport.types === 'string') return rootExport.types;
	if (typeof manifest.types === 'string') return manifest.types;
	return null;
}

export function validateInstalledTypes(plan, consumerRoot) {
	const missing = [];
	for (const pkg of plan.packages) {
		const packageRoot = join(consumerRoot, 'node_modules', ...pkg.name.split('/'));
		const manifestPath = join(packageRoot, 'package.json');
		if (!existsSync(manifestPath)) {
			missing.push(`${pkg.name}: package.json is missing`);
			continue;
		}
		const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
		const typePath = packageTypePath(manifest);
		if (!typePath || !existsSync(join(packageRoot, typePath.replace(/^\.\//, '')))) {
			missing.push(`${pkg.name}: declared TypeScript entry point is missing`);
		}
	}
	return missing;
}

export function runConsumerSmoke(plan, npm = 'npm') {
	const consumerRoot = mkdtempSync(join(tmpdir(), 'svforge-consumer-'));
	try {
		writeFileSync(join(consumerRoot, 'package.json'), JSON.stringify({ private: true, type: 'module' }) + '\n');
		const exactPackages = plan.packages.map((pkg) => `${pkg.name}@${pkg.version}`);
		execFileSync(npm, ['install', '--ignore-scripts', '--no-package-lock', '--no-save', ...exactPackages], {
			cwd: consumerRoot,
			stdio: 'inherit'
		});
		const missing = validateInstalledTypes(plan, consumerRoot);
		if (missing.length) throw new Error(`Consumer type smoke test failed:\n- ${missing.join('\n- ')}`);
		console.log(`Consumer smoke test OK for ${plan.packages.length} package(s).`);
	} finally {
		rmSync(consumerRoot, { recursive: true, force: true });
	}
}

if (import.meta.url === `file://${process.argv[1]}`) {
	const planFlagIndex = process.argv.indexOf('--plan');
	const planPath = planFlagIndex === -1 ? null : process.argv[planFlagIndex + 1];
	if (!planPath) {
		console.error('Usage: node scripts/npm-consumer-smoke.mjs --plan <release-plan.json>');
		process.exitCode = 1;
	} else {
		try {
			runConsumerSmoke(JSON.parse(readFileSync(resolve(planPath), 'utf8')));
		} catch (error) {
			console.error(`Consumer smoke test failed: ${error.message}`);
			process.exitCode = 1;
		}
	}
}
