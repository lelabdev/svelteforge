#!/usr/bin/env node
/**
 * SVForge CLI — doctor (diagnostics), check (design-system harness) and
 * upgrade (module upgrades).
 *
 * Exposed via the `svforge` bin (#189, #240):
 *   npx svforge doctor
 *   npx svforge check [--strict]
 *   npx svforge upgrade <module> [--to <version>] [--force]
 */




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
		// Strict mode (#344): WARN is blocking too, for opt-in Git hooks.
		const strict = args.includes('--strict');
		const results = await api.checkDesignSystem(projectRoot);
		const errors = results.filter((r) => r.status === 'error');
		const warnings = results.filter((r) => r.status === 'warn');
		console.log('\n SVForge check (design system)\n');
		for (const r of results) {
			const icon = r.status === 'ok' ? '✓' : r.status === 'warn' ? '⚠' : '✗';
			console.log(`  ${icon} [${r.module}] ${r.status.toUpperCase()}: ${r.message}`);
		}
		if (errors.length || (strict && warnings.length)) {
			console.log(`\n✗ ${errors.length + (strict ? warnings.length : 0)} design-system violation(s). Fix them before proceeding.`);
		} else if (warnings.length) {
			console.log(`\n⚠ ${warnings.length} warning(s) — review, not blocking.`);
		} else {
			console.log('\n✓ Design system is clean.');
		}
		process.exitCode = errors.length || (strict && warnings.length) ? 1 : 0;
		return;
	}

	if (command === 'preset') {
		// Preset recipe (#236): print the exact sv add composition.
		const presetName = args.find((a) => !a.startsWith('-'));
		if (!presetName || !api.PRESETS[presetName]) {
			console.error('Usage: svforge preset <name>');
			console.error(`Available presets: ${Object.keys(api.PRESETS ?? {}).join(', ')}`);
			process.exitCode = 1;
			return;
		}
		const specs = api.expandPreset(presetName);
		console.log(`\n Preset: ${presetName} — ${api.PRESETS[presetName].description}\n`);
		console.log('  Composition (run with sv add, no parallel CLI):\n');
		console.log(`  sv add ${specs.join(' ')}`);
		const preset = api.PRESETS[presetName];
		if (preset.optional?.length) {
			console.log(`\n  Optional (never auto-installed): ${preset.optional.join(', ')}\n`);
		}
		return;
	}

	if (command === 'context') {
		// Regenerate the AI context from the real project state (#234):
		// read .svforge.json, rewrite llms.txt deterministically.
		const fs = await import('node:fs');
		const path = await import('node:path');
		const manifestPath = path.join(projectRoot, '.svforge.json');
		const llmstxtPath = path.join(projectRoot, 'llms.txt');
		if (!fs.existsSync(manifestPath)) {
			console.error('.svforge.json not found — run this in a SvelteForge project root.');
			process.exitCode = 1;
			return;
		}
		const manifest = fs.readFileSync(manifestPath, 'utf-8');
		try {
			fs.writeFileSync(llmstxtPath, api.regenerateLlmstxt(manifest));
		} catch (error) {
			// #324: a corrupt manifest must fail loudly with its remediation,
			// never silently regenerate from an empty base project.
			console.error(error instanceof Error ? error.message : String(error));
			process.exitCode = 1;
			return;
		}
		console.log('✓ llms.txt regenerated from .svforge.json (#234).');
		return;
	}

	if (command === 'upgrade') {
		const moduleName = args.find((a) => !a.startsWith('-'));
		const force = args.includes('--force');
		const targetIndex = args.indexOf('--to');
		const targetVersion = targetIndex === -1 ? undefined : args[targetIndex + 1];
		if (targetIndex !== -1 && !targetVersion) {
			console.error('Usage: svforge upgrade <module> [--to <version>] [--force]');
			process.exitCode = 1;
			return;
		}
		if (!moduleName) {
			console.error('Usage: svforge upgrade <module> [--to <version>] [--force]');
			console.error(`Available modules: ${Object.keys(api.MODULE_RECIPES ?? {}).join(', ')}`);
			process.exitCode = 1;
			return;
		}
		try {
			const result = await api.upgrade(moduleName, projectRoot, { force, targetVersion });
			api.printUpgradeResult(result);
			process.exitCode = result.skippedCount > 0 && !force ? 1 : 0;
		} catch (e) {
			console.error(`Upgrade failed: ${e instanceof Error ? e.message : e}`);
			process.exitCode = 1;
		}
		return;
	}

	console.error('Usage: svforge <doctor|check [--strict]|preset|upgrade>');
	process.exitCode = 1;
}

main();
