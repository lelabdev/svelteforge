import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
	buildManifest,
	renderLlmstxt,
	mergeManifest,
	regenerateLlmstxt
} from '../packages/svforge/src/ai-context';
import { validateManifestShape } from '../packages/addon-kit/src/json';
import {
	DEFAULT_PROFILE,
	DEPLOYMENT_PROFILES,
	MODULE_PROFILES
} from '../packages/addon-kit/src/index';

const ROOT = process.cwd();

/**
 * Tests for #332 — runtime capabilities/constraints surfaced through the AI
 * context (.svforge.json + llms.txt). An agent reading the project context
 * must see the declared deployment profile and each installed module's
 * supported/unsupported profiles BEFORE proposing a deployment architecture.
 */
describe('#332 — deployment context in the AI surfaces', () => {
	it('the manifest declares the deployment profile (default: node-long-lived)', () => {
		const m = buildManifest('dashboard', ['jobs']);
		expect(m.deployment).toEqual({ profile: 'node-long-lived' });
		expect(DEFAULT_PROFILE).toBe('node-long-lived');
		// An explicit declaration is honored.
		const edge = buildManifest('dashboard', [], 'edge');
		expect(edge.deployment).toEqual({ profile: 'edge' });
	});

	it('moduleCapabilities list supported AND unsupported profiles for every installed module', () => {
		const m = buildManifest('dashboard', ['jobs', 'audit']);
		expect(m.moduleCapabilities?.jobs.profiles).toEqual({
			supported: ['node-long-lived', 'separate-worker'],
			unsupported: ['serverless', 'edge']
		});
		// Every installed module gets the matrix, not only runtime-constrained ones.
		expect(m.moduleCapabilities?.audit.profiles).toEqual(MODULE_PROFILES.audit && {
			supported: MODULE_PROFILES.audit.supported,
			unsupported: MODULE_PROFILES.audit.unsupported
		});
	});

	it('the manifest shape validator accepts a valid deployment block and rejects malformed ones', () => {
		const good = buildManifest('dashboard', []);
		expect(validateManifestShape(good, '.svforge.json')).toEqual([]);
		for (const bad of [
			{ ...good, deployment: { profile: 'quantum' } },
			{ ...good, deployment: { profile: 42 } },
			{ ...good, deployment: 'serverless' },
			{ ...good, deployment: {} }
		]) {
			const problems = validateManifestShape(bad, '.svforge.json');
			expect(problems.length, JSON.stringify(bad.deployment)).toBeGreaterThan(0);
			expect(problems.join(' ')).toMatch(/deployment/);
		}
		// Old manifests without the block stay valid (backwards compatibility).
		const legacy = buildManifest('base', []);
		delete (legacy as { deployment?: unknown }).deployment;
		expect(validateManifestShape(legacy, '.svforge.json')).toEqual([]);
		// All four profile values pass validation.
		for (const profile of DEPLOYMENT_PROFILES) {
			expect(validateManifestShape({ ...good, deployment: { profile } }, '.svforge.json')).toEqual([]);
		}
	});

	it('llms.txt carries a Deployment section an agent can act on', () => {
		const txt = renderLlmstxt(buildManifest('dashboard', ['jobs', 'realtime']));
		expect(txt).toContain('## Deployment');
		expect(txt).toContain('node-long-lived — Long-lived Node server');
		// Per-module constraints for the installed modules.
		expect(txt).toMatch(/jobs[^\n]*serverless/);
		expect(txt).toMatch(/realtime[^\n]*serverless/);
		// Agent rule: check profiles BEFORE proposing a deployment architecture.
		expect(txt).toMatch(/before proposing a deployment architecture/i);
		// How to switch the profile.
		expect(txt).toContain('deployment.profile');
	});

	it('llms.txt lists the separate-worker escape hatch for constrained modules', () => {
		const txt = renderLlmstxt(buildManifest('dashboard', ['jobs']));
		expect(txt).toMatch(/separate-worker/i);
	});

	it('mergeManifest preserves a previously declared profile (user edits win)', () => {
		const declared = buildManifest('base', [], 'serverless');
		const merged = mergeManifest(declared, 'base', ['uploads']);
		expect(merged.deployment).toEqual({ profile: 'serverless' });
		// No prior declaration → scaffold default.
		const fresh = mergeManifest(buildManifest('base', []), 'base', ['uploads']);
		expect(fresh.deployment).toEqual({ profile: 'node-long-lived' });
	});

	it('regenerateLlmstxt keeps the DECLARED profile (never resets to the default)', () => {
		const manifest = JSON.stringify(buildManifest('dashboard', ['jobs'], 'separate-worker'));
		const txt = regenerateLlmstxt(manifest);
		expect(txt).toContain('separate-worker');
		expect(txt).not.toContain('profile: node-long-lived');
		// An invalid profile is a validation error, not a silent default.
		const broken = JSON.stringify({ ...buildManifest('dashboard', []), deployment: { profile: 'nope' } });
		expect(() => regenerateLlmstxt(broken)).toThrow(/deployment/);
	});

	it('the scaffolded modes keep writing the context (deployment included)', () => {
		for (const mode of ['base', 'dashboard']) {
			const src = readFileSync(join(ROOT, `packages/svforge/src/modes/${mode}.ts`), 'utf-8');
			expect(src).toMatch(/buildManifest\('/);
			expect(src).toMatch(/llms\.txt/);
		}
	});
});
