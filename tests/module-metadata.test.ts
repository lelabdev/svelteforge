import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const manifest = JSON.parse(
	readFileSync(join(ROOT, 'packages/svforge/templates/base/root/svforge-modules.json'), 'utf-8')
);

/**
 * Integrity checks for the machine-readable SVForge module contract (#257).
 *
 * Public documentation is deliberately not part of this contract: README files
 * are editorial and must remain free to change structure or wording without
 * breaking CI.
 */
describe('module metadata contract (#257)', () => {
	it('declares self-consistent modules and template requirements', () => {
		const externalCapabilities = new Set(['testpack']);

		for (const [id, module] of Object.entries<any>(manifest.modules)) {
			expect(module.id).toBe(id);
			expect(module.description?.trim().length).toBeGreaterThan(0);
			expect(module.requires?.length).toBeGreaterThan(0);
			expect(module.files?.length).toBeGreaterThan(0);

			for (const requirement of module.requires) {
				expect(manifest.templates).toHaveProperty(requirement);
			}

			for (const integration of module.optional ?? []) {
				if (!externalCapabilities.has(integration)) {
					expect(manifest.modules).toHaveProperty(integration);
				}
			}
		}
	});

	it('presets only reference declared templates and modules', () => {
		for (const preset of Object.values<any>(manifest.presets)) {
			expect(preset.description?.trim().length).toBeGreaterThan(0);
			expect(preset.requires?.length).toBeGreaterThan(0);

			for (const requirement of preset.requires) {
				expect(manifest.templates).toHaveProperty(requirement);
			}

			for (const moduleId of [...(preset.modules ?? []), ...(preset.optional ?? [])]) {
				expect(manifest.modules).toHaveProperty(moduleId);
			}
		}
	});
});
