import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
	MODULE_CONTRACTS,
	CAPABILITIES,
	DEPLOYMENT_PROFILES,
	DEPLOYMENT_PROFILE_INFO,
	DEFAULT_PROFILE,
	MODULE_PROFILES
} from '../packages/addon-kit/src/index';

const ROOT = process.cwd();
const manifest = JSON.parse(
	readFileSync(join(ROOT, 'packages/svforge/templates/base/root/svforge-modules.json'), 'utf-8')
);

/**
 * Integrity checks for the machine-readable SVForge module contract (#257).
 * Updated by #323: modules declare a capability contract (template + requires/
 * provides/optional) instead of template names; the delivered JSON must match
 * the shared addon-kit contract exactly.
 */
describe('module metadata contract (#257, capabilities #323)', () => {
	it('declares self-consistent modules with capability contracts', () => {
		const externalModules = new Set<string>();

		for (const [id, module] of Object.entries<any>(manifest.modules)) {
			expect(module.id).toBe(id);
			expect(module.description?.trim().length).toBeGreaterThan(0);
			expect(['base', 'dashboard']).toContain(module.template);
			expect(module.files?.length).toBeGreaterThan(0);

			for (const requirement of module.requires ?? []) {
				expect(CAPABILITIES as Record<string, unknown>).toHaveProperty(requirement);
			}
			for (const provided of module.provides ?? []) {
				expect(CAPABILITIES as Record<string, unknown>).toHaveProperty(provided);
			}
			for (const optional of module.optional ?? []) {
				expect(CAPABILITIES as Record<string, unknown>).toHaveProperty(optional);
			}
			for (const mod of module.optionalModules ?? []) {
				if (!externalModules.has(mod)) {
					expect(manifest.modules).toHaveProperty(mod);
				}
			}
		}
	});

	it('the delivered capability contracts match @svforge/addon-kit (single source of truth)', () => {
		expect(Object.keys(manifest.modules).sort()).toEqual(Object.keys(MODULE_CONTRACTS).sort());
		for (const [id, contract] of Object.entries(MODULE_CONTRACTS)) {
			const delivered = manifest.modules[id];
			expect(delivered.template).toBe(contract.template);
			expect(delivered.requires).toEqual(contract.requires);
			expect(delivered.provides).toEqual(contract.provides);
			expect(delivered.optional).toEqual(contract.optional);
			expect(delivered.optionalModules).toEqual(contract.optionalModules);
		}
	});

	it('templates declare the capabilities they provide', () => {
		for (const [template, info] of Object.entries<any>(manifest.templates)) {
			expect(info.description?.trim().length).toBeGreaterThan(0);
			expect(info.provides?.length).toBeGreaterThan(0);
			for (const token of info.provides) {
				expect(CAPABILITIES as Record<string, unknown>).toHaveProperty(token);
			}
			void template;
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

	it('delivers the deployment profiles exactly as @svforge/addon-kit defines them (#332)', () => {
		expect(manifest.deployment.defaultProfile).toBe(DEFAULT_PROFILE);
		expect(Object.keys(manifest.deployment.profiles).sort()).toEqual([...DEPLOYMENT_PROFILES].sort());
		for (const profile of DEPLOYMENT_PROFILES) {
			const delivered = manifest.deployment.profiles[profile];
			const expected = DEPLOYMENT_PROFILE_INFO[profile];
			expect(delivered.title).toBe(expected.title);
			expect(delivered.description).toBe(expected.description);
			expect(delivered.appLifecycle).toBe(expected.appLifecycle);
			expect(delivered.runtime).toEqual(expected.runtime);
		}
		// The per-module matrix mirrors MODULE_PROFILES exactly.
		expect(Object.keys(manifest.deployment.modules).sort()).toEqual(Object.keys(MODULE_PROFILES).sort());
		for (const [id, entry] of Object.entries(MODULE_PROFILES)) {
			const delivered = manifest.deployment.modules[id];
			expect(delivered.supported).toEqual(entry.supported);
			expect(delivered.unsupported).toEqual(entry.unsupported);
			expect(delivered.notes).toEqual(entry.notes);
		}
	});
});
