import { MODULE_CONTRACTS, type Capability } from './capabilities';

/**
 * SVForge deployment profiles (#332).
 *
 * Modules carry runtime constraints (`runtime.longLivedWorker`,
 * `runtime.websocket`, a TCP Postgres client, an in-process runner…). Until
 * now those constraints were scattered across READMEs or left to "next
 * steps" — an agent could scaffold a job runner into a serverless function
 * without any signal. This module is the SINGLE SOURCE OF TRUTH answering
 * one question: "is this installed module compatible with this deployment?"
 *
 * Surfaces derived from it (they must never hand-copy the matrix):
 *   - .svforge.json (`deployment.profile`, `moduleCapabilities.*.profiles`)
 *   - llms.txt ("## Deployment" section)
 *   - `npx svforge doctor` (profile incompatibility warnings)
 *   - the delivered `svforge-modules.json` metadata
 *   - docs/deploy/* examples
 */

// ── Profiles ────────────────────────────────────────────────────────

export const DEPLOYMENT_PROFILES = ['node-long-lived', 'serverless', 'edge', 'separate-worker'] as const;

export type DeploymentProfile = (typeof DEPLOYMENT_PROFILES)[number];

/** The scaffold default — matches what the generated code assumes out of the box. */
export const DEFAULT_PROFILE: DeploymentProfile = 'node-long-lived';

/** Where a runtime capability lives under a profile. */
export type RuntimePlacement =
	/** The capability runs inside the app process itself. */
	| 'in-process'
	/** The capability runs on the dedicated worker deployment, never in the web process. */
	| 'separate'
	/** The capability cannot run under this profile at all. */
	| 'unsupported';

export interface DeploymentProfileInfo {
	title: string;
	description: string;
	/** Concrete platforms/adapters (documentation only, non-exhaustive). */
	examples: string[];
	/**
	 * Lifecycle of the HTTP-serving process. Drives the PostgreSQL client
	 * configuration (pooling vs serverless-safe single connection).
	 */
	appLifecycle: 'long-lived' | 'ephemeral';
	/** Placement of the two runtime capability tokens under this profile. */
	runtime: Record<'runtime.longLivedWorker' | 'runtime.websocket', RuntimePlacement>;
	/** Additional deployment notes (DB drivers, connection pooling…). */
	notes: string[];
}

export const DEPLOYMENT_PROFILE_INFO: Record<DeploymentProfile, DeploymentProfileInfo> = {
	'node-long-lived': {
		title: 'Long-lived Node server',
		description:
			'an always-on Node process: background timers and WebSocket servers live in the same process as the app',
		examples: ['adapter-node on a VPS or container', 'Coolify / Docker Compose', 'systemd service behind a reverse proxy'],
		appLifecycle: 'long-lived',
		runtime: { 'runtime.longLivedWorker': 'in-process', 'runtime.websocket': 'in-process' },
		notes: []
	},
	serverless: {
		title: 'Serverless functions',
		description:
			'short-lived, request-scoped functions: no background timer survives the request and no WebSocket server can be held open',
		examples: ['Vercel functions', 'Netlify functions', 'AWS Lambda'],
		appLifecycle: 'ephemeral',
		runtime: { 'runtime.longLivedWorker': 'unsupported', 'runtime.websocket': 'unsupported' },
		notes: [
			'use a connection pooler (Neon, Supabase pooler, PgBouncer) and set DATABASE_RUNTIME=serverless so src/lib/server/db uses the serverless-safe client'
		]
	},
	edge: {
		title: 'Edge runtime',
		description:
			'edge isolates (V8 workers): no long-lived process, no WebSocket server, and no raw TCP sockets — Node drivers do not run there',
		examples: ['Cloudflare Workers/Pages', 'Deno Deploy', 'Vercel Edge'],
		appLifecycle: 'ephemeral',
		runtime: { 'runtime.longLivedWorker': 'unsupported', 'runtime.websocket': 'unsupported' },
		notes: [
			'postgres.js opens raw TCP sockets: the SVForge database stack needs an HTTP-driver replacement SVForge does not provide'
		]
	},
	'separate-worker': {
		title: 'Serverless app + long-lived worker',
		description:
			'the web app runs serverless while background jobs and the WebSocket server run on a dedicated long-lived Node deployment of the SAME codebase',
		examples: ['Vercel app + worker container running the same image', 'serverless app + one adapter-node worker (JOBS_WORKER=worker)'],
		appLifecycle: 'ephemeral',
		runtime: { 'runtime.longLivedWorker': 'separate', 'runtime.websocket': 'separate' },
		notes: [
			'only the worker deployment runs the job runner / WS server; web replicas set JOBS_WORKER=web so they never start one'
		]
	}
};

const RUNTIME_TOKENS = new Set<Capability>(['runtime.longLivedWorker', 'runtime.websocket']);

/** Support of one capability under one profile. */
export function profileCapabilityPlacement(profile: DeploymentProfile, token: Capability): 'in-process' | 'separate' | 'unsupported' | 'supported' {
	if (!RUNTIME_TOKENS.has(token)) return 'supported';
	return DEPLOYMENT_PROFILE_INFO[profile].runtime[token as 'runtime.longLivedWorker' | 'runtime.websocket'];
}

// ── Module ⇄ profile matrix ─────────────────────────────────────────

export interface ModuleProfileContract {
	/** Profiles where the module works as installed. */
	supported: DeploymentProfile[];
	/** Profiles where the module does NOT work (explicit — absence of proof is not proof of absence). */
	unsupported: DeploymentProfile[];
	/** Why a profile is unsupported / how to deploy instead (keyed by profile). */
	notes: Partial<Record<DeploymentProfile, string>>;
}

const ALL_PROFILES: readonly DeploymentProfile[] = DEPLOYMENT_PROFILES;

/** Contract for modules with no runtime coupling: they run on every profile. */
function everywhere(): ModuleProfileContract {
	return { supported: [...ALL_PROFILES], unsupported: [], notes: {} };
}

/**
 * The module ⇄ deployment matrix (#332). Complete over MODULE_CONTRACTS —
 * `validateModuleProfiles()` enforces it so a new module CANNOT ship without
 * declaring where it runs.
 */
export const MODULE_PROFILES: Record<string, ModuleProfileContract> = {
	ui_toast: everywhere(),
	dnd: everywhere(),
	tiptap: everywhere(),
	graph: everywhere(),
	blog: everywhere(),
	email: everywhere(),
	oauth: everywhere(),
	uploads: everywhere(),
	audit: {
		supported: ['node-long-lived', 'serverless', 'separate-worker'],
		unsupported: ['edge'],
		notes: {
			edge: 'postgres.js opens raw TCP sockets, which edge isolates do not allow — run the app on Node (long-lived or serverless) or replace the DB driver with an HTTP-driver implementation'
		}
	},
	notifications: {
		supported: ['node-long-lived', 'serverless', 'separate-worker'],
		unsupported: ['edge'],
		notes: {
			edge: 'postgres.js opens raw TCP sockets, which edge isolates do not allow — run the app on Node (long-lived or serverless) or replace the DB driver with an HTTP-driver implementation'
		}
	},
	chat: {
		supported: ['node-long-lived', 'serverless', 'separate-worker'],
		unsupported: ['edge'],
		notes: {
			edge: 'postgres.js opens raw TCP sockets, which edge isolates do not allow — run the app on Node (long-lived or serverless) or replace the DB driver with an HTTP-driver implementation'
		}
	},
	jobs: {
		supported: ['node-long-lived', 'separate-worker'],
		unsupported: ['serverless', 'edge'],
		notes: {
			serverless:
				'the in-process runner is killed between requests — use the separate-worker profile: a dedicated long-lived worker deployment (JOBS_WORKER=worker) polls the queue while web replicas set JOBS_WORKER=web',
			edge: 'no long-lived process and no raw TCP sockets — run the worker on Node (separate-worker profile)',
			'separate-worker':
				'the runner lives ONLY on the dedicated worker deployment (JOBS_WORKER=worker); web replicas set JOBS_WORKER=web and merely enqueue'
		}
	},
	realtime: {
		supported: ['node-long-lived', 'separate-worker'],
		unsupported: ['serverless', 'edge'],
		notes: {
			serverless:
				'function instances cannot hold WebSocket servers open — use the separate-worker profile: hub.listen(PORT) on a dedicated long-lived Node/WS server, with the app publishing through a shared backend (e.g. Postgres LISTEN/NOTIFY) or HTTP calls to that server',
			edge: 'no WebSocket server and no Node net stack — run the WS server on Node (separate-worker profile)',
			'separate-worker':
				'run the WS server on the dedicated worker deployment via hub.listen(PORT) — SvelteKit serverless adapters never expose the underlying HTTP server'
		}
	}
};

/** Structural invariants of the matrix (used by tests and callable from CI). */
export function validateModuleProfiles(): string[] {
	const problems: string[] = [];
	const contractIds = Object.keys(MODULE_CONTRACTS).sort();
	const matrixIds = Object.keys(MODULE_PROFILES).sort();
	if (contractIds.join(',') !== matrixIds.join(',')) {
		problems.push(
			`MODULE_PROFILES must cover exactly the MODULE_CONTRACTS modules — missing: ${contractIds.filter((id) => !matrixIds.includes(id)).join(', ') || 'none'}; unknown: ${matrixIds.filter((id) => !contractIds.includes(id)).join(', ') || 'none'}.`
		);
	}
	for (const [id, entry] of Object.entries(MODULE_PROFILES)) {
		const union = new Set([...entry.supported, ...entry.unsupported]);
		for (const profile of DEPLOYMENT_PROFILES) {
			if (!union.has(profile)) problems.push(`${id}: profile "${profile}" is neither supported nor unsupported.`);
			if (entry.supported.includes(profile) && entry.unsupported.includes(profile)) {
				problems.push(`${id}: profile "${profile}" is both supported and unsupported.`);
			}
		}
		if (entry.supported.length === 0) problems.push(`${id}: must support at least one profile.`);
		for (const noteProfile of Object.keys(entry.notes)) {
			if (!DEPLOYMENT_PROFILES.includes(noteProfile as DeploymentProfile)) {
				problems.push(`${id}: note on unknown profile "${noteProfile}".`);
			}
		}
	}
	return problems;
}

// ── Conflict detection (doctor, llms.txt) ───────────────────────────

export interface ProfileConflict {
	moduleId: string;
	/** The declared profile this module is incompatible with. */
	profile: DeploymentProfile;
	/** Human-readable reason + remedy (from the matrix notes). */
	reason: string;
}

/**
 * Installed modules that are incompatible with the DECLARED deployment
 * profile. Only explicit `unsupported` entries conflict — unknown module ids
 * are ignored so the doctor stays tolerant of hand-edited manifests.
 */
export function profileConflicts(
	profile: DeploymentProfile,
	moduleIds: readonly string[]
): ProfileConflict[] {
	const conflicts: ProfileConflict[] = [];
	for (const moduleId of moduleIds) {
		const entry = MODULE_PROFILES[moduleId];
		if (!entry) continue;
		if (!entry.unsupported.includes(profile)) continue;
		const note = entry.notes[profile];
		const reason = note
			? `${moduleId} does not run on the "${profile}" profile: ${note}`
			: `${moduleId} does not run on the "${profile}" profile.`;
		conflicts.push({ moduleId, profile, reason });
	}
	return conflicts;
}

/** Readable, agent-usable summary of one profile (doctor / llms.txt / docs). */
export function describeProfile(profile: DeploymentProfile): string {
	const info = DEPLOYMENT_PROFILE_INFO[profile];
	const lines: string[] = [];
	lines.push(`${profile} — ${info.title}: ${info.description}`);
	lines.push(`  Examples: ${info.examples.join(', ')}`);
	lines.push(
		`  Runtime placement: background worker = ${info.runtime['runtime.longLivedWorker']}, WebSocket = ${info.runtime['runtime.websocket']} (app lifecycle: ${info.appLifecycle})`
	);
	for (const note of info.notes) lines.push(`  Note: ${note}`);
	const constrained = Object.entries(MODULE_PROFILES).filter(([, entry]) => entry.unsupported.includes(profile));
	if (constrained.length > 0) {
		lines.push(`  Installed-module conflicts to check: ${constrained.map(([id]) => id).join(', ')}`);
	}
	return lines.join('\n');
}
