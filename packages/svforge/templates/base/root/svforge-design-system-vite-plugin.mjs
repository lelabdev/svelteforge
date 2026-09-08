/**
 * Production-only Vite gate for the scaffolded SVForge design-system checker.
 *
 * This imports the exact checker used by `bun run check`; no scanner or rule
 * diagnostics are duplicated for builds. WARN diagnostics stay informational
 * unless a project deliberately opts into strict mode.
 */
import { checkDesignSystem } from './svforge-check.mjs';

export function svforgeDesignSystemPlugin({ root = process.cwd(), strict = false } = {}) {
	return {
		name: 'svforge-design-system',
		apply: 'build',
		async buildStart() {
			const diagnostics = await checkDesignSystem(root);
			const blocking = diagnostics.filter((diagnostic) =>
				diagnostic.status === 'error' || (strict && diagnostic.status === 'warn')
			);
			if (blocking.length > 0) {
				throw new Error(
					`SVForge design-system build gate failed:\n${blocking
						.map((diagnostic) => `  [${diagnostic.status.toUpperCase()}] ${diagnostic.msg}`)
						.join('\n')}`
				);
			}
		}
	};
}
