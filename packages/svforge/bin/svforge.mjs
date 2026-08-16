#!/usr/bin/env node
/**
 * SVForge CLI — doctor (diagnostics), check (design-system harness) and
 * upgrade (module upgrades).
 *
 * Exposed via the `svforge` bin (#189, #240):
 *   npx svforge doctor
 *   npx svforge check
 *   npx svforge upgrade <module> [--force]
 */
import { createRequire } from 'node:module';
import { resolve } from 'node:path';

const require = createRequire(import.meta.url);
// The dist is bundled by tsdown; load it the same way the package exports do.
const api = await import('../dist/index.js');

const [, , command, ...args] = process.argv;

async function main() {
	const projectRoot = process.cwd();

	if (command === 'doctor') {
		const report = await api.doctor(projectRoot);
		api.printReport(report);
		process.exitCode = report.healthy ? 0 : 1;
		return;
	}

	if (command === 'check') {
		// Design-system harness (#240): ERROR blocks, WARN is informational.
		const results = await api.checkDesignSystem(projectRoot);
		const errors = results.filter((r: { status: string }) => r.status === 'error');
		const warnings = results.filter((r: { status: string }) => r.status === 'warn');
		console.log('\n SVForge check (design system)\n');
		for (const r of results) {
			const icon = r.status === 'ok' ? '✓' : r.status === 'warn' ? '⚠' : '✗';
			console.log(`  ${icon} [${r.module}] ${r.status.toUpperCase()}: ${r.message}`);
		}
		if (errors.length) {
			console.log(`\n✗ ${errors.length} design-system violation(s). Fix them before proceeding.`);
		} else if (warnings.length) {
			console.log(`\n⚠ ${warnings.length} warning(s) — review, not blocking.`);
		} else {
			console.log('\n✓ Design system is clean.');
		}
		process.exitCode = errors.length ? 1 : 0;
		return;
	}

	if (command === 'upgrade') {
		const moduleName = args.find((a) => !a.startsWith('-'));
		const force = args.includes('--force');
		if (!moduleName) {
			console.error('Usage: svforge upgrade <module> [--force]');
			console.error(`Available modules: ${Object.keys(api.MODULE_RECIPES ?? {}).join(', ')}`);
			process.exitCode = 1;
			return;
		}
		try {
			const result = await api.upgrade(moduleName, projectRoot, { force });
			api.printUpgradeResult(result);
			process.exitCode = result.skippedCount > 0 && !force ? 1 : 0;
		} catch (e) {
			console.error(`Upgrade failed: ${e instanceof Error ? e.message : e}`);
			process.exitCode = 1;
		}
		return;
	}

	console.error('Usage: svforge <doctor|check|upgrade>');
	process.exitCode = 1;
}

main();
