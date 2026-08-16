#!/usr/bin/env node
/**
 * SVForge CLI — doctor (diagnostics) and upgrade (module upgrades).
 *
 * Exposed via the `svforge` bin (#189):
 *   npx svforge doctor
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

	console.error('Usage: svforge <doctor|upgrade>');
	process.exitCode = 1;
}

main();
