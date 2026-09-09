import { describe, it, expect } from 'vitest';
import {
	DEPLOYMENT_PROFILES,
	DEPLOYMENT_PROFILE_INFO,
	DEFAULT_PROFILE,
	MODULE_PROFILES,
	profileCapabilityPlacement,
	profileConflicts,
	validateModuleProfiles,
	describeProfile
} from '../packages/addon-kit/src/index';
import { MODULE_CONTRACTS, CAPABILITY_TOKENS } from '../packages/addon-kit/src/index';

/**
 * Tests for #332 — documented deployment profiles.
 *
 * The goal: a human or AI agent must immediately determine whether an
 * installed module is compatible with the selected deployment target.
 * The single source of truth lives in @svforge/addon-kit; every other
 * surface (.svforge.json, llms.txt, doctor, module READMEs, delivered
 * svforge-modules.json) derives from it.
 */
describe('#332 — deployment profiles', () => {
	it('defines exactly the four documented profiles with complete info', () => {
		expect(DEPLOYMENT_PROFILES).toEqual(['node-long-lived', 'serverless', 'edge', 'separate-worker']);
		for (const profile of DEPLOYMENT_PROFILES) {
			const info = DEPLOYMENT_PROFILE_INFO[profile];
			expect(info.title.length).toBeGreaterThan(0);
			expect(info.description.length).toBeGreaterThan(0);
			expect(info.examples.length).toBeGreaterThan(0);
			// The lifecycle drives the DB client configuration (#332).
			expect(['long-lived', 'ephemeral']).toContain(info.appLifecycle);
		}
	});

	it('the default profile is the long-lived Node server (scaffold assumption)', () => {
		expect(DEFAULT_PROFILE).toBe('node-long-lived');
		expect(DEPLOYMENT_PROFILE_INFO['node-long-lived'].appLifecycle).toBe('long-lived');
	});

	it('runtime capabilities are in-process on node, unsupported on serverless/edge, separate on the worker profile', () => {
		const runtimeTokens = ['runtime.longLivedWorker', 'runtime.websocket'] as const;
		expect(profileCapabilityPlacement('node-long-lived', 'runtime.websocket')).toBe('in-process');
		expect(profileCapabilityPlacement('node-long-lived', 'runtime.longLivedWorker')).toBe('in-process');
		expect(profileCapabilityPlacement('serverless', 'runtime.websocket')).toBe('unsupported');
		expect(profileCapabilityPlacement('serverless', 'runtime.longLivedWorker')).toBe('unsupported');
		expect(profileCapabilityPlacement('edge', 'runtime.longLivedWorker')).toBe('unsupported');
		expect(profileCapabilityPlacement('edge', 'runtime.websocket')).toBe('unsupported');
		expect(profileCapabilityPlacement('separate-worker', 'runtime.longLivedWorker')).toBe('separate');
		expect(profileCapabilityPlacement('separate-worker', 'runtime.websocket')).toBe('separate');
		// Non-runtime capabilities are deployment-independent.
		for (const token of CAPABILITY_TOKENS) {
			if (runtimeTokens.includes(token as (typeof runtimeTokens)[number])) continue;
			expect(profileCapabilityPlacement('serverless', token), token).toBe('supported');
			expect(profileCapabilityPlacement('edge', token), token).toBe('supported');
		}
		void runtimeTokens;
	});

	it('EVERY module lists supported AND unsupported profiles (the #332 contract)', () => {
		// Completeness: the matrix covers every module with a capability contract.
		expect(Object.keys(MODULE_PROFILES).sort()).toEqual(Object.keys(MODULE_CONTRACTS).sort());
		for (const [id, entry] of Object.entries(MODULE_PROFILES)) {
			expect(new Set([...entry.supported, ...entry.unsupported]), id).toEqual(new Set(DEPLOYMENT_PROFILES));
			// Disjoint: a profile is either supported or unsupported, never both.
			for (const p of entry.supported) expect(entry.unsupported, `${id}/${p}`).not.toContain(p);
			expect(entry.supported.length, `${id} must support at least one profile`).toBeGreaterThan(0);
		}
	});

	it('validateModuleProfiles() enforces the invariants for CI', () => {
		expect(validateModuleProfiles()).toEqual([]);
	});

	it('runtime modules are constrained exactly as the issue demands', () => {
		// jobs needs a long-lived runtime → serverless/edge are out; the
		// separate-worker profile (#328) is the serverless-compatible path.
		expect(MODULE_PROFILES.jobs.supported).toEqual(['node-long-lived', 'separate-worker']);
		expect(MODULE_PROFILES.jobs.unsupported).toEqual(['serverless', 'edge']);
		expect(MODULE_PROFILES.jobs.notes['serverless']).toMatch(/worker/i);
		expect(MODULE_PROFILES.jobs.notes['separate-worker']).toMatch(/JOBS_WORKER/i);
		// realtime needs a WS server → same constraint, separate WS server option.
		expect(MODULE_PROFILES.realtime.supported).toEqual(['node-long-lived', 'separate-worker']);
		expect(MODULE_PROFILES.realtime.unsupported).toEqual(['serverless', 'edge']);
		expect(MODULE_PROFILES.realtime.notes['separate-worker']).toMatch(/WebSocket|WS server|separate/i);
		// DB modules: fine on long-lived Node and serverless (with pooling),
		// not on edge (postgres.js opens raw TCP sockets).
		for (const id of ['audit', 'notifications', 'chat']) {
			expect(MODULE_PROFILES[id].supported).toContain('serverless');
			expect(MODULE_PROFILES[id].unsupported).toEqual(['edge']);
			expect(MODULE_PROFILES[id].notes.edge).toMatch(/TCP|HTTP driver|postgres\.js/i);
		}
		// UI/API-only modules run everywhere.
		for (const id of ['ui_toast', 'dnd', 'tiptap', 'graph', 'blog', 'email', 'oauth', 'uploads']) {
			expect(MODULE_PROFILES[id].unsupported, id).toEqual([]);
		}
	});

	it('profileConflicts() reports installed modules incompatible with the declared profile', () => {
		const conflicts = profileConflicts('serverless', ['email', 'jobs', 'audit']);
		expect(conflicts.map((c) => c.moduleId)).toEqual(['jobs']);
		expect(conflicts[0]!.reason).toMatch(/long-lived|runner|worker/i);

		const edgeConflicts = profileConflicts('edge', ['audit', 'realtime', 'email']);
		expect(edgeConflicts.map((c) => c.moduleId).sort()).toEqual(['audit', 'realtime']);

		// A compatible selection produces NO conflict.
		expect(profileConflicts('node-long-lived', ['jobs', 'realtime', 'audit'])).toEqual([]);
		expect(profileConflicts('separate-worker', ['jobs', 'realtime'])).toEqual([]);
		// Unknown module ids are ignored (doctor stays tolerant).
		expect(profileConflicts('serverless', ['not-a-module'])).toEqual([]);
	});

	it('describeProfile() renders a readable, agent-usable summary', () => {
		const text = describeProfile('separate-worker');
		expect(text).toContain('separate-worker');
		expect(text).toContain('Serverless app + long-lived worker');
		expect(text).toMatch(/jobs|realtime/i);
	});
});
