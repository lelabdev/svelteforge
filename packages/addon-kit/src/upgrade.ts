/**
 * Diffable upgrade engine (#327) — the ONE upgrade protocol shared by the
 * `svforge` addon (base/dashboard) and every @svforge/* module.
 *
 * Properties (all behavioral, see tests/upgrade-engine*.test.ts):
 *
 * - PLAN FIRST: `planUpgrade` reads the project and produces a full,
 *   JSON-serializable operation list (with readable diffs) BEFORE any write.
 * - DRY RUN: `applyPlan(plan, …, { dryRun: true })` writes nothing — not even
 *   the tracking file.
 * - VERSIONED MIGRATIONS: add, modify, delete, move, dependency, script and
 *   JSON transformation — boilerplate migration is no longer src-only copying.
 * - ONE DESTINATION RESOLVER: `resolveDestination` maps manifest paths to
 *   project paths for BOTH src-delivered and root-delivered files.
 * - SHA-256: baselines use SHA-256 (the legacy 32-bit hash is never trusted —
 *   it degrades to "no baseline", i.e. conservative skip, #283 preserved).
 * - VERSIONED BACKUPS: every apply backs up overwritten content under
 *   `.svforge-backup/<recipe>/<timestamp>-<version>/` — successive upgrades
 *   never overwrite a previous backup.
 * - ATOMIC-OR-UNCHANGED: on any mid-apply failure every completed write is
 *   rolled back from the fresh backup — including the tracking file, which is
 *   written LAST inside the rollback-protected scope — leaving the project
 *   exactly as it was (no stray backup directory either).
 *
 * The engine is dependency-free (node builtins only) and bundled into every
 * addon dist, so modules can adopt the exact same protocol.
 */

import { createHash } from 'node:crypto';
import {
	copyFileSync,
	existsSync,
	lstatSync,
	mkdirSync,
	readFileSync,
	readdirSync,
	realpathSync,
	rmSync,
	statSync,
	writeFileSync,
	type Stats
} from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';

// ── Checksums ────────────────────────────────────────────────────────────

/** SHA-256 of a string, as 64 lowercase hex characters (#327). */
export function sha256(content: string): string {
	return createHash('sha256').update(content, 'utf-8').digest('hex');
}

/** True when the value looks like a SHA-256 hex digest produced by sha256(). */
export function isSha256(value: unknown): value is string {
	return typeof value === 'string' && /^[0-9a-f]{64}$/.test(value);
}

// ── Destination resolution (single canonical rule) ──────────────────────

const SRC_PREFIX = 'src/';

// ── Path containment guard (#386) ────────────────────────────────────────

/**
 * Lexical containment check for a PROJECT-RELATIVE path derived from recipe
 * data (#386): it must be a non-empty string, never absolute, and never
 * contain a `..` traversal segment. Fails closed with a readable error
 * naming the offending path.
 */
export function assertSafeRelativePath(relativePath: string, what = 'path'): void {
	if (typeof relativePath !== 'string' || relativePath.trim() === '') {
		throw new Error(
			`Invalid ${what}: expected a non-empty project-relative path, got ${JSON.stringify(relativePath)} (#386).`
		);
	}
	if (isAbsolute(relativePath)) {
		throw new Error(
			`Invalid ${what}: "${relativePath}" is an absolute path — recipe paths must stay inside the project root (#386).`
		);
	}
	if (relativePath.split(/[\\/]/).includes('..')) {
		throw new Error(
			`Invalid ${what}: "${relativePath}" contains a ".." traversal segment — recipe paths must stay inside the project root (#386).`
		);
	}
}

/** True when `rel` (a path relative to some base) stays inside that base. */
function staysInside(rel: string): boolean {
	return rel !== '' && rel !== '..' && !rel.startsWith(`..${sep}`) && !isAbsolute(rel);
}

/** True when the path exists — WITHOUT following symlinks (lstat, #386). */
function lstatSafe(path: string): boolean {
	try {
		lstatSync(path);
		return true;
	} catch {
		return false;
	}
}

/**
 * Full containment check before ANY filesystem effect — read, write, backup,
 * move or delete (#386):
 *
 *   1. lexical rules (see assertSafeRelativePath),
 *   2. the resolved target must stay INSIDE the project root,
 *   3. symlinks: the deepest EXISTING component of the path (found with an
 *      lstat walk, never existsSync — a DANGLING symlink reads as "absent"
 *      to existsSync but the later write would still follow it outside the
 *      root) must resolve inside the REAL root. Because realpath resolves
 *      the whole chain, one check covers every ancestor symlink too.
 *
 * Fails closed: any uncertainty is an error, before any partial write.
 *
 * @returns the resolved absolute path, guaranteed to stay inside the root.
 */
export function safeProjectPath(projectRoot: string, relativePath: string, what = 'path'): string {
	assertSafeRelativePath(relativePath, what);
	const root = resolve(projectRoot);
	const full = resolve(root, relativePath);
	if (!staysInside(relative(root, full))) {
		throw new Error(
			`Invalid ${what}: "${relativePath}" resolves to "${full}", outside the project root "${root}" (#386).`
		);
	}
	try {
		const realRoot = realpathSync(root);
		// lstat-based walk (#386): lstat does NOT follow symlinks, so a dangling
		// symlink is reported as a symlink instead of being skipped as "absent"
		// (existsSync would skip it, and the later writeFileSync would follow
		// the link OUTSIDE the root).
		let current = full;
		for (;;) {
			let st: Stats;
			try {
				st = lstatSync(current);
			} catch (walkError) {
				if ((walkError as NodeJS.ErrnoException).code === 'ENOENT') {
					// Genuinely absent — keep walking toward the root.
					const parent = dirname(current);
					if (parent === current || current === root) break;
					current = parent;
					continue;
				}
				throw walkError;
			}
			// Deepest existing component: its realpath resolves the ENTIRE chain
			// above it, so ONE containment check covers every ancestor symlink.
			let realTarget: string;
			try {
				realTarget = realpathSync(current);
			} catch (linkError) {
				if (st.isSymbolicLink() && (linkError as NodeJS.ErrnoException).code === 'ENOENT') {
					throw new Error(
						`Invalid ${what}: "${relativePath}" crosses a DANGLING symlink ("${current}") whose target does not exist — containment cannot be verified, refusing (#386).`,
						{ cause: linkError }
					);
				}
				throw linkError;
			}
			// '' here means the component IS the (real) root — valid. Only a
			// resolution OUTSIDE the real root is refused.
			const relReal = relative(realRoot, realTarget);
			if (relReal !== '' && !staysInside(relReal)) {
				throw new Error(
					`Invalid ${what}: "${relativePath}" resolves through a symlink to "${realTarget}", outside the project root (#386).`
				);
			}
			break;
		}
	} catch (error) {
		if (error instanceof Error && error.message.includes('#386')) throw error;
		throw new Error(`Invalid ${what}: cannot verify containment of "${relativePath}" — refusing (#386).`, {
			cause: error
		});
	}
	return full;
}

/**
 * Resolve a manifest path ("/lib/ui/Button.svelte") to its project-relative
 * destination. A path is delivered at the PROJECT ROOT when it matches a
 * `rootPaths` entry exactly, or when an entry ending with "/" is a directory
 * prefix of it (e.g. "/e2e/" covers "/e2e/auth.test.ts"). Everything else is
 * src-relative (#187/#235/#239 delivery model).
 *
 * The result is lexically contained (#386): no absolute path and no `..`
 * segment can leave the project root through a manifest path.
 */
export function resolveDestination(manifestPath: string, rootPaths: readonly string[] = []): string {
	if (!manifestPath.startsWith('/')) {
		throw new Error(`Manifest paths must start with "/" — got "${manifestPath}".`);
	}
	const stripped = manifestPath.slice(1);
	assertSafeRelativePath(stripped, `manifest path "${manifestPath}"`);
	const isRoot = rootPaths.some((entry) => {
		const clean = entry.startsWith('/') ? entry.slice(1) : entry;
		return clean.endsWith('/') ? stripped.startsWith(clean) : clean === stripped;
	});
	return isRoot ? stripped : `${SRC_PREFIX}${stripped}`;
}

// ── Tracking file (.svforge-versions.json) ──────────────────────────────

export const TRACKING_FILE = '.svforge-versions.json';
export const BACKUP_ROOT = '.svforge-backup';

/** Per-recipe baseline: what WE last installed, per project-relative path. */
export interface RecipeTracking {
	version: string;
	/** Project-relative destination (POSIX) → SHA-256 of the installed content. */
	fileChecksums: Record<string, string>;
	updatedAt?: string;
}

export type TrackingFile = Record<string, RecipeTracking>;

/**
 * Read the tracking file. Missing or corrupt → {}. The read is
 * containment-checked FIRST (#386): a symlinked tracking file must not
 * redirect the read outside the project root.
 */
export function loadTrackingFile(projectRoot: string): TrackingFile {
	safeProjectPath(projectRoot, TRACKING_FILE, 'tracking file');
	try {
		const parsed = JSON.parse(readFileSync(join(projectRoot, TRACKING_FILE), 'utf-8')) as unknown;
		if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
		return parsed as TrackingFile;
	} catch {
		return {};
	}
}

export function saveTrackingFile(projectRoot: string, state: TrackingFile): void {
	// The tracking file is a WRITE destination derived from engine constants —
	// it must pass the same containment check as recipe paths (#386), or a
	// symlinked `.svforge-versions.json` would redirect the write outside the
	// project root.
	writeFileSync(
		safeProjectPath(projectRoot, TRACKING_FILE, 'tracking file'),
		`${JSON.stringify(state, null, 2)}\n`
	);
}

/**
 * Baseline checksum of one path, ONLY when it is a valid SHA-256 recorded by
 * a previous install. Legacy 32-bit hashes (pre-#327 installs) return
 * undefined — the safe "no baseline" that degrades to conservative skip.
 */
export function baselineChecksum(tracking: TrackingFile, recipeId: string, dest: string): string | undefined {
	const recorded = tracking[recipeId]?.fileChecksums?.[dest];
	return isSha256(recorded) ? recorded : undefined;
}

/**
 * Compute the fresh-install baseline of a recipe: destination → SHA-256 of
 * the delivered content. Used by the scaffold modes to initialize
 * `.svforge-versions.json` during installation (#327) so the FIRST upgrade
 * already has a real baseline.
 */
export function computeBaseline(
	files: Record<string, string>,
	rootPaths: readonly string[] = []
): Record<string, string> {
	const baseline: Record<string, string> = {};
	for (const [manifestPath, content] of Object.entries(files)) {
		baseline[resolveDestination(manifestPath, rootPaths)] = sha256(content);
	}
	return baseline;
}

/** Serialized tracking file initializing one recipe baseline (install time). */
export function initTrackingJson(
	recipeId: string,
	version: string,
	files: Record<string, string>,
	rootPaths: readonly string[] = []
): string {
	const entry: RecipeTracking = {
		version,
		fileChecksums: computeBaseline(files, rootPaths),
		updatedAt: new Date().toISOString()
	};
	return `${JSON.stringify({ [recipeId]: entry }, null, 2)}\n`;
}

// ── Recipes ─────────────────────────────────────────────────────────────

/**
 * A versioned recipe: everything an upgrade needs to migrate one addon's
 * owned surface of a project.
 */
export interface UpgradeRecipe {
	/** Recipe id: "base" | "dashboard" | module id (e.g. "blog"). */
	id: string;
	/** Recipe version (the target of the upgrade). */
	version: string;
	/** Manifest path ("/x/y") → full delivered content. */
	files: Record<string, string>;
	/** Manifest paths delivered at the project root (see resolveDestination). */
	rootPaths: readonly string[];
	/** Manifest paths REMOVED by this recipe version (deletion migrations). */
	deletions?: readonly string[];
	/** Rename/move migrations: old manifest path → new manifest path. */
	moves?: Readonly<Record<string, string>>;
	/** Dependency migrations applied to package.json. */
	dependencies?: readonly { name: string; range: string; dev?: boolean }[];
	/** package.json script migrations; null removes the script. */
	scripts?: Readonly<Record<string, string | null>>;
	/** JSON transformations: deep-set keys inside an existing JSON file. */
	jsonTransforms?: readonly { file: string; set: Record<string, unknown> }[];
}

/** Factory used by @svforge/* modules to declare their upgrade recipe. */
export function defineModuleRecipe(recipe: Omit<UpgradeRecipe, 'rootPaths'> & { rootPaths?: readonly string[] }): UpgradeRecipe {
	return { rootPaths: [], ...recipe };
}

// ── Planning ────────────────────────────────────────────────────────────

export type PlannedAction = 'add' | 'modify' | 'delete' | 'move' | 'dependency' | 'script' | 'json';
export type PlannedResolution = 'apply' | 'conflict' | 'unchanged' | 'skipped';

/** One planned operation — plain data, JSON-serializable. */
export interface PlannedOperation {
	action: PlannedAction;
	/** Project-relative destination (POSIX). */
	path: string;
	resolution: PlannedResolution;
	/** Human-readable explanation, always present. */
	reason: string;
	/** Readable line diff for modify/delete/move (empty unless there is a change). */
	diff?: string;
	/** move: source destination path. */
	from?: string;
	/** move: target destination path. */
	to?: string;
	dependency?: { name: string; range: string; dev: boolean; previous?: string };
	script?: { name: string; command: string | null; previous?: string };
	jsonTransform?: { file: string; keys: string[] };
}

export interface UpgradePlan {
	module: string;
	fromVersion: string | null;
	toVersion: string;
	operations: PlannedOperation[];
	summary: Record<PlannedAction | 'conflicts' | 'unchanged' | 'skipped', number>;
}

export interface PlanOptions {
	force?: boolean;
	/** Pre-loaded tracking state (defaults to reading the project's file). */
	tracking?: TrackingFile;
	/** Manifest paths excluded from the plan with a reason (e.g. the
	 *  playwright profile on a vitest project). */
	exclusions?: readonly { manifestPath: string; reason: string }[];
}

/** Read package.json as data. Throws a readable error when absent/invalid. */
export function readPackageJson(projectRoot: string): { json: Record<string, unknown>; raw: string } {
	// Containment-checked like every other project read (#386): package.json is
	// read by name from recipe-adjacent code, so a symlink planted at
	// `<root>/package.json` must not redirect the read outside the root.
	const full = safeProjectPath(projectRoot, 'package.json', 'package.json');
	const raw = readFileSync(full, 'utf-8');
	try {
		return { json: JSON.parse(raw) as Record<string, unknown>, raw };
	} catch (error) {
		throw new Error(`package.json is not valid JSON: ${(error as Error).message}`, { cause: error });
	}
}

function lineDiff(before: string, after: string, context = 3): string {
	const a = before.split('\n');
	const b = after.split('\n');
	// Guard against pathological inputs: a summary instead of a huge LCS.
	if (a.length * b.length > 4_000_000) {
		return `(large file: ${a.length} lines → ${b.length} lines)`;
	}
	// LCS table.
	const lcs: number[][] = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
	for (let i = a.length - 1; i >= 0; i--) {
		for (let j = b.length - 1; j >= 0; j--) {
			lcs[i][j] = a[i] === b[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
		}
	}
	type Line = { kind: ' ' | '-' | '+'; text: string };
	const lines: Line[] = [];
	let i = 0;
	let j = 0;
	while (i < a.length && j < b.length) {
		if (a[i] === b[j]) {
			lines.push({ kind: ' ', text: a[i] });
			i++;
			j++;
		} else if (lcs[i + 1][j] >= lcs[i][j + 1]) {
			lines.push({ kind: '-', text: a[i] });
			i++;
		} else {
			lines.push({ kind: '+', text: b[j] });
			j++;
		}
	}
	while (i < a.length) lines.push({ kind: '-', text: a[i++] });
	while (j < b.length) lines.push({ kind: '+', text: b[j++] });

	// Hunks with `context` lines of surrounding context.
	const hunks: string[] = [];
	let start = 0;
	while (start < lines.length) {
		if (lines[start].kind === ' ') {
			start++;
			continue;
		}
		const from = Math.max(0, start - context);
		let to = start;
		while (to < lines.length && (lines[to].kind !== ' ' || lines.slice(to, to + context + 1).some((l) => l.kind !== ' '))) to++;
		to = Math.min(lines.length, to + context);
		const kept = lines.slice(from, to);
		let aNo = 1;
		let bNo = 1;
		for (let k = 0; k < from; k++) {
			if (lines[k].kind !== '+') aNo++;
			if (lines[k].kind !== '-') bNo++;
		}
		let aCount = 0;
		let bCount = 0;
		for (const line of kept) {
			if (line.kind !== '+') aCount++;
			if (line.kind !== '-') bCount++;
		}
		hunks.push(`@@ -${aNo},${aCount} +${bNo},${bCount} @@\n${kept.map((l) => l.kind + l.text).join('\n')}`);
		start = to;
	}
	return hunks.join('\n');
}

function diffFor(path: string, before: string, after: string): string {
	return `--- a/${path}\n+++ b/${path}\n${lineDiff(before, after)}`;
}

/** Dependency lookup across BOTH maps (either placement counts). */
function currentRange(pkg: Record<string, unknown>, name: string): { range: string; dev: boolean } | undefined {
	const dependencies = pkg.dependencies as Record<string, string> | undefined;
	const devDependencies = pkg.devDependencies as Record<string, string> | undefined;
	if (dependencies?.[name]) return { range: dependencies[name], dev: false };
	if (devDependencies?.[name]) return { range: devDependencies[name], dev: true };
	return undefined;
}

type JsonNode = Record<string, unknown>;

function deepSet(target: JsonNode, path: (string | number)[], value: unknown): void {
	let node = target;
	for (let i = 0; i < path.length - 1; i++) {
		const key = path[i];
		if (typeof node[key] !== 'object' || node[key] === null) node[key] = {};
		node = node[key] as JsonNode;
	}
	node[path[path.length - 1]] = value;
}

/**
 * Plan an upgrade: read the project state and compute every operation with
 * its resolution BEFORE anything is written (#327). Never writes to disk.
 */
export function planUpgrade(recipe: UpgradeRecipe, projectRoot: string, options: PlanOptions = {}): UpgradePlan {
	const force = options.force ?? false;
	const tracking = options.tracking ?? loadTrackingFile(projectRoot);
	const excluded = new Map((options.exclusions ?? []).map((e) => [e.manifestPath, e.reason]));

	// package.json is the backbone of dependency/script migrations — its
	// absence means this is not a SvelteKit project root.
	readPackageJson(projectRoot);

	const operations: PlannedOperation[] = [];
	const claimed = new Set<string>();
	const claim = (dest: string, what: string) => {
		if (claimed.has(dest)) throw new Error(`Recipe "${recipe.id}" plans two operations on "${dest}" (${what}).`);
		claimed.add(dest);
	};

	// ── add / modify ──
	for (const [manifestPath, content] of Object.entries(recipe.files)) {
		const dest = resolveDestination(manifestPath, recipe.rootPaths);
		claim(dest, 'file');
		const excludeReason = excluded.get(manifestPath);
		if (excludeReason) {
			operations.push({ action: 'add', path: dest, resolution: 'skipped', reason: excludeReason });
			continue;
		}
		const full = safeProjectPath(projectRoot, dest, `recipe "${recipe.id}" file`);
		if (!existsSync(full)) {
			operations.push({
				action: 'add',
				path: dest,
				resolution: 'apply',
				reason: 'New file delivered by the recipe.',
				diff: diffFor(dest, '', content)
			});
			continue;
		}
		if (statSync(full).isDirectory()) {
			operations.push({
				action: 'modify',
				path: dest,
				resolution: 'conflict',
				reason: 'A DIRECTORY exists at this path — a file cannot be delivered over it. Remove it, then re-run.',
				diff: diffFor(dest, '', content)
			});
			continue;
		}
		const current = readFileSync(full, 'utf-8');
		if (current === content) {
			operations.push({ action: 'modify', path: dest, resolution: 'unchanged', reason: 'Already up to date.' });
			continue;
		}
		const baseline = baselineChecksum(tracking, recipe.id, dest);
		const userModified = baseline === undefined || baseline !== sha256(current);
		if (userModified && !force) {
			operations.push({
				action: 'modify',
				path: dest,
				resolution: 'conflict',
				reason: baseline === undefined
					? 'Local content differs and no install baseline exists — treated as a user modification (#283). Use --force to overwrite.'
					: 'Modified since the last install — treated as a user modification (#283). Use --force to overwrite.',
				diff: diffFor(dest, current, content)
			});
		} else {
			operations.push({
				action: 'modify',
				path: dest,
				resolution: 'apply',
				reason: force && userModified ? 'Updated (user modification overwritten by --force).' : 'Updated to the new recipe version.',
				diff: diffFor(dest, current, content)
			});
		}
	}

	// ── delete ──
	for (const manifestPath of recipe.deletions ?? []) {
		const dest = resolveDestination(manifestPath, recipe.rootPaths);
		claim(dest, 'deletion');
		const full = safeProjectPath(projectRoot, dest, `recipe "${recipe.id}" deletion`);
		if (!existsSync(full)) {
			operations.push({ action: 'delete', path: dest, resolution: 'unchanged', reason: 'Already absent.' });
			continue;
		}
		const current = readFileSync(full, 'utf-8');
		const baseline = baselineChecksum(tracking, recipe.id, dest);
		const userModified = baseline === undefined || baseline !== sha256(current);
		if (userModified && !force) {
			operations.push({
				action: 'delete',
				path: dest,
				resolution: 'conflict',
				reason: 'File removed by the recipe, but its content was modified locally — preserved. Use --force to delete.',
				diff: diffFor(dest, current, '')
			});
		} else {
			operations.push({
				action: 'delete',
				path: dest,
				resolution: 'apply',
				reason: 'Removed by the new recipe version.',
				diff: diffFor(dest, current, '')
			});
		}
	}

	// ── move ──
	for (const [fromManifest, toManifest] of Object.entries(recipe.moves ?? {})) {
		const from = resolveDestination(fromManifest, recipe.rootPaths);
		const to = resolveDestination(toManifest, recipe.rootPaths);
		claim(from, 'move source');
		claim(to, 'move target');
		const fromFull = safeProjectPath(projectRoot, from, `recipe "${recipe.id}" move source`);
		const toFull = safeProjectPath(projectRoot, to, `recipe "${recipe.id}" move target`);
		if (!existsSync(fromFull)) {
			operations.push({ action: 'move', path: to, from, to, resolution: 'unchanged', reason: 'Source already absent (renamed or removed earlier).' });
			continue;
		}
		const current = readFileSync(fromFull, 'utf-8');
		const baseline = baselineChecksum(tracking, recipe.id, from);
		const userModified = baseline === undefined || baseline !== sha256(current);
		// User-content protection FIRST: renaming locally modified content is
		// refused before anything else is considered.
		if (userModified && !force) {
			operations.push({
				action: 'move',
				path: to,
				from,
				to,
				resolution: 'conflict',
				reason: 'Source was modified locally — renaming would lose user content. Use --force to rename anyway.',
				diff: diffFor(from, current, current)
			});
			continue;
		}
		if (existsSync(toFull)) {
			const currentTo = readFileSync(toFull, 'utf-8');
			operations.push({
				action: 'move',
				path: to,
				from,
				to,
				resolution: 'conflict',
				reason: 'Rename target already exists — never overwritten.',
				diff: diffFor(to, currentTo, currentTo)
			});
			continue;
		}
		operations.push({
			action: 'move',
			path: to,
			from,
			to,
			resolution: 'apply',
			reason: 'Renamed by the new recipe version (content preserved).',
			diff: diffFor(from, current, current)
		});
	}

	// ── dependency ──
	for (const dep of recipe.dependencies ?? []) {
		const pkg = readPackageJson(projectRoot).json;
		const current = currentRange(pkg, dep.name);
		if (current && current.range === dep.range) {
			operations.push({
				action: 'dependency',
				path: 'package.json',
				resolution: 'unchanged',
				reason: `${dep.name} already at ${dep.range}.`,
				dependency: { name: dep.name, range: dep.range, dev: dep.dev ?? false, previous: current.range }
			});
			continue;
		}
		const switchedMap = current ? current.dev !== (dep.dev ?? false) : false;
		operations.push({
			action: 'dependency',
			path: 'package.json',
			resolution: 'apply',
			reason: current
				? `${dep.name}: ${current.range} → ${dep.range}${switchedMap ? ` (moved to ${dep.dev ? 'dev' : 'regular'} dependencies)` : ''}.`
				: `${dep.name} added at ${dep.range}.`,
			dependency: { name: dep.name, range: dep.range, dev: dep.dev ?? false, previous: current?.range }
		});
	}

	// ── script ──
	for (const [name, command] of Object.entries(recipe.scripts ?? {})) {
		const pkg = readPackageJson(projectRoot).json;
		const previous = (pkg.scripts as Record<string, string | undefined> | undefined)?.[name];
		if (previous === command) {
			operations.push({
				action: 'script',
				path: 'package.json',
				resolution: 'unchanged',
				reason: `Script "${name}" already up to date.`,
				script: { name, command, previous }
			});
			continue;
		}
		operations.push({
			action: 'script',
			path: 'package.json',
			resolution: 'apply',
			reason: command === null
				? `Script "${name}" removed${previous ? ` (was: ${previous})` : ''}.`
				: `Script "${name}"${previous ? `: ${previous} → ${command}` : ` set to ${command}`}.`,
			script: { name, command, previous }
		});
	}

	// ── json transformation ──
	for (const transform of recipe.jsonTransforms ?? []) {
		const full = safeProjectPath(projectRoot, transform.file, `recipe "${recipe.id}" JSON transformation target`);
		const keys = Object.keys(transform.set);
		if (!existsSync(full)) {
			operations.push({
				action: 'json',
				path: transform.file,
				resolution: 'conflict',
				reason: `JSON transformation targets "${transform.file}" which does not exist.`,
				jsonTransform: { file: transform.file, keys }
			});
			continue;
		}
		let json: Record<string, unknown>;
		try {
			json = JSON.parse(readFileSync(full, 'utf-8')) as Record<string, unknown>;
		} catch (error) {
			operations.push({
				action: 'json',
				path: transform.file,
				resolution: 'conflict',
				reason: `"${transform.file}" is not valid JSON (${(error as Error).message}) — transformation refused.`,
				jsonTransform: { file: transform.file, keys }
			});
			continue;
		}
		const updated = structuredClone(json);
		for (const [key, value] of Object.entries(transform.set)) deepSet(updated, key.split('.'), value);
		if (JSON.stringify(updated) === JSON.stringify(json)) {
			operations.push({
				action: 'json',
				path: transform.file,
				resolution: 'unchanged',
				reason: `"${transform.file}" already has the target values.`,
				jsonTransform: { file: transform.file, keys }
			});
			continue;
		}
		operations.push({
			action: 'json',
			path: transform.file,
			resolution: 'apply',
			reason: `"${transform.file}" updated: ${keys.join(', ')}.`,
			jsonTransform: { file: transform.file, keys }
		});
	}

	const summary = operations.reduce(
		(acc, op) => {
			acc[op.action] = (acc[op.action] ?? 0) + 1;
			if (op.resolution === 'conflict') acc.conflicts++;
			else if (op.resolution === 'unchanged') acc.unchanged++;
			else if (op.resolution === 'skipped') acc.skipped++;
			return acc;
		},
		{ add: 0, modify: 0, delete: 0, move: 0, dependency: 0, script: 0, json: 0, conflicts: 0, unchanged: 0, skipped: 0 } as UpgradePlan['summary']
	);

	return {
		module: recipe.id,
		fromVersion: tracking[recipe.id]?.version ?? null,
		toVersion: recipe.version,
		operations,
		summary
	};
}

// ── Apply ───────────────────────────────────────────────────────────────

export interface ApplyOptions {
	/** Plan only — write NOTHING (not even the tracking file). */
	dryRun?: boolean;
	/** Fixed timestamp source (tests / deterministic backups). */
	now?: Date;
}

export interface ApplyResult {
	dryRun: boolean;
	/** Number of operations actually applied. */
	applied: number;
	/** Backup directory (project-relative) when destructive writes happened. */
	backupDir?: string;
	/** True when a mid-apply failure reverted every completed write. */
	rolledBack: boolean;
	/** Populated when rolledBack — the original error message. */
	error?: string;
}

interface JournalEntry {
	/** Project-relative path written. */
	dest: string;
	/** The file existed before this upgrade (its content is in the backup). */
	existed: boolean;
	/** Project-relative backup path of the ORIGINAL content (when existed). */
	backupPath?: string;
	/** Content to restore for a move source (kept in memory — small files). */
	moveFrom?: string;
}

function pruneEmptyDirs(projectRoot: string, dir: string): void {
	let current = dir;
	while (current !== projectRoot && current.startsWith(projectRoot)) {
		try {
			if (readdirSync(current).length > 0) return;
			rmSync(current, { recursive: true });
		} catch {
			return;
		}
		current = dirname(current);
	}
}

function stamp(now: Date): string {
	return now.toISOString().replace(/[:.]/g, '-');
}

/**
 * Apply a plan. Destructive writes are backed up under a versioned,
 * timestamped directory; any failure rolls back every completed write — files
 * AND the tracking file — so the project is left exactly as it was (#327).
 * Backup and tracking destinations are containment-checked like recipe paths
 * (#386); after a rollback the freshly created backup directory is removed.
 */
export function applyPlan(recipe: UpgradeRecipe, plan: UpgradePlan, projectRoot: string, options: ApplyOptions = {}): ApplyResult {
	const dryRun = options.dryRun ?? false;
	if (dryRun) {
		return { dryRun: true, applied: 0, rolledBack: false };
	}

	const applicable = plan.operations.filter((op) => op.resolution === 'apply');
	const now = options.now ?? new Date();

	// ── Fail closed BEFORE any filesystem effect (#386) ──
	// A plan is plain data: even a hand-built/poisoned plan cannot direct a
	// write, backup or deletion outside the project root. Every path of every
	// applicable operation is validated before the first backup is taken.
	assertSafeRelativePath(recipe.id, `recipe id "${recipe.id}"`);
	for (const op of applicable) {
		safeProjectPath(projectRoot, op.path, `planned ${op.action}`);
		if (op.action === 'move' && op.from) safeProjectPath(projectRoot, op.from, 'planned move source');
	}
	// The backup and tracking destinations are engine-owned but sit on the
	// same filesystem boundary: a malicious recipe id or a planted symlink
	// (.svforge-backup dir, .svforge-versions.json) must not redirect the
	// writes outside the root (#386). Both are containment-checked here,
	// before the first backup is taken.
	const backupBase = safeProjectPath(
		projectRoot,
		join(BACKUP_ROOT, recipe.id, `${stamp(now)}-${plan.toVersion}`),
		'backup directory'
	);
	safeProjectPath(projectRoot, TRACKING_FILE, 'tracking file');

	const journal: JournalEntry[] = [];
	let backupDir: string | undefined;
	/** The backup dir actually SELECTED by ensureBackupDir (suffixed on collision). */
	let selectedBackup: string | undefined;

	const ensureBackupDir = (): string => {
		if (selectedBackup) return selectedBackup;
		let candidate = backupBase;
		let suffix = 1;
		// lstat, not existsSync: a dangling symlink at the candidate path is
		// still an occupied name — never create a directory over it (#386).
		while (lstatSafe(candidate)) {
			candidate = `${backupBase}-${suffix}`;
			suffix++;
		}
		mkdirSync(candidate, { recursive: true });
		selectedBackup = candidate;
		return candidate;
	};

	const backupOf = (dest: string, backupRootDir: string): string => {
		const backupPath = join(backupRootDir, dest);
		mkdirSync(dirname(backupPath), { recursive: true });
		copyFileSync(safeProjectPath(projectRoot, dest, 'backup source'), backupPath);
		return backupPath;
	};

	const writeTracking = () => {
		const tracking = loadTrackingFile(projectRoot);
		const checksums: Record<string, string> = { ...(tracking[recipe.id]?.fileChecksums ?? {}) };
		// Record what THIS upgrade delivers — applied writes AND already
		// identical files (#327): a standalone module's first upgrade finds its
		// files unchanged and must still baseline them, or every later upgrade
		// would treat them as user modifications (#283). Skipped and conflicted
		// paths keep their previous baseline (or none).
		for (const op of plan.operations) {
			if (op.action === 'add' || op.action === 'modify') {
				if (op.resolution !== 'apply' && op.resolution !== 'unchanged') continue;
				const manifestPath = Object.keys(recipe.files).find((p) => resolveDestination(p, recipe.rootPaths) === op.path);
				if (manifestPath) checksums[op.path] = sha256(recipe.files[manifestPath]);
			} else if (op.action === 'delete') {
				if (op.resolution === 'apply') delete checksums[op.path];
			} else if (op.action === 'move' && op.from && op.to && op.resolution === 'apply') {
				delete checksums[op.from];
				// The moved content is what landed on disk (a pure rename carries
				// the source content, which is not in recipe.files).
				const movedFull = safeProjectPath(projectRoot, op.to, 'move tracking');
				if (existsSync(movedFull)) checksums[op.to] = sha256(readFileSync(movedFull, 'utf-8'));
			}
		}
		tracking[recipe.id] = {
			version: plan.toVersion,
			fileChecksums: checksums,
			updatedAt: now.toISOString()
		};
		saveTrackingFile(projectRoot, tracking);
	};

	// Exact pre-apply state of the tracking file — writeTracking runs INSIDE
	// the try below, so a rollback must be able to restore it byte for byte
	// (#327 atomicity).
	const trackingPath = join(projectRoot, TRACKING_FILE);
	const trackingSnapshot = lstatSafe(trackingPath) ? readFileSync(trackingPath, 'utf-8') : undefined;

	try {
		// ── Phase 1: backups (before ANY write) ──
		const toBackup: string[] = [];
		for (const op of applicable) {
			if (op.action === 'modify' || op.action === 'delete' || op.action === 'json') toBackup.push(op.path);
			if (op.action === 'move' && op.from) toBackup.push(op.from);
			if (op.action === 'dependency' || op.action === 'script') toBackup.push('package.json');
		}
		const uniqueBackups = [...new Set(toBackup)].filter((dest) => existsSync(join(projectRoot, dest)));
		if (uniqueBackups.length > 0) {
			const backupRootDir = ensureBackupDir();
			for (const dest of uniqueBackups) backupOf(dest, backupRootDir);
			backupDir = backupRootDir.slice(projectRoot.length + 1);
		}

		// ── Phase 2: writes with journal ──
		const applyOne = (op: PlannedOperation): void => {
			if (op.action === 'add' || op.action === 'modify') {
				const manifestPath = Object.keys(recipe.files).find((p) => resolveDestination(p, recipe.rootPaths) === op.path);
				if (!manifestPath) throw new Error(`Apply lost the recipe content for "${op.path}".`);
				const full = safeProjectPath(projectRoot, op.path, `applied ${op.action}`);
				const existed = existsSync(full);
				// Journal BEFORE mutating: if mkdir/write fails after changing the
				// filesystem, rollback must already know how to undo this operation.
				journal.push({ dest: op.path, existed });
				if (!existed) mkdirSync(dirname(full), { recursive: true });
				writeFileSync(full, recipe.files[manifestPath]);
				return;
			}
			if (op.action === 'json' || op.action === 'dependency' || op.action === 'script') {
				const full = safeProjectPath(projectRoot, op.path, `applied ${op.action}`);
				const existed = existsSync(full);
				let json: Record<string, unknown>;
				try {
					json = JSON.parse(readFileSync(full, 'utf-8')) as Record<string, unknown>;
				} catch (error) {
					throw new Error(`Cannot apply "${op.path}": ${(error as Error).message}`, { cause: error });
				}
				if (op.action === 'json') {
					const transform = recipe.jsonTransforms?.find((t) => t.file === op.path);
					if (transform) {
						for (const [key, value] of Object.entries(transform.set)) deepSet(json, key.split('.'), value);
					}
				} else if (op.action === 'dependency' && op.dependency) {
					const { name, range, dev } = op.dependency;
					// The dependency belongs in exactly one map — remove a stale
					// placement from the other when switching.
					if (dev) {
						delete (json.dependencies as JsonNode | undefined)?.[name];
						json.devDependencies = { ...((json.devDependencies as JsonNode | undefined) ?? {}), [name]: range };
					} else {
						delete (json.devDependencies as JsonNode | undefined)?.[name];
						json.dependencies = { ...((json.dependencies as JsonNode | undefined) ?? {}), [name]: range };
					}
				} else if (op.action === 'script' && op.script) {
					const scripts = (json.scripts as JsonNode | undefined) ?? {};
					if (op.script.command === null) delete scripts[op.script.name];
					else scripts[op.script.name] = op.script.command;
					json.scripts = scripts;
				}
				// Journal BEFORE mutating: a failed package/JSON write must be
				// rolled back even if the write partially changed the file.
				journal.push({ dest: op.path, existed });
				writeFileSync(full, `${JSON.stringify(json, null, 2)}\n`);
				return;
			}
			if (op.action === 'move' && op.from && op.to) {
				const fromFull = safeProjectPath(projectRoot, op.from, 'applied move source');
				const toFull = safeProjectPath(projectRoot, op.to, 'applied move target');
				const content = readFileSync(fromFull, 'utf-8');
				// Journal BEFORE mutating (#327 atomic-or-unchanged): a move has
				// THREE fallible writes (mkdir + write on the target, rm on the
				// source). Journaling after them would leave a mid-move failure
				// with NO undo entry — the new target stays behind and the project
				// is half-moved. Both undo halves are safe no-ops when nothing (or
				// only part) was written: rmSync(force) on an absent target, and
				// rewriting identical content over an intact source.
				journal.push({ dest: op.to, existed: false, moveFrom: content });
				mkdirSync(dirname(toFull), { recursive: true });
				writeFileSync(toFull, content);
				rmSync(fromFull, { force: true });
				pruneEmptyDirs(projectRoot, dirname(fromFull));
				return;
			}
			if (op.action === 'delete') {
				// Journal BEFORE mutating: rm/pruning can fail after the file or
				// its parent directory has already been removed.
				journal.push({ dest: op.path, existed: true });
				rmSync(safeProjectPath(projectRoot, op.path, 'applied deletion'), { force: true });
				pruneEmptyDirs(projectRoot, dirname(join(projectRoot, op.path)));
				return;
			}
			throw new Error(`Unsupported operation: ${op.action}`);
		};

		// File writes first, then JSON/package.json, then moves (they free old
		// paths), then deletions — a deterministic, dependency-safe order.
		const order = (op: PlannedOperation): number => {
			if (op.action === 'add' || op.action === 'modify') return 0;
			if (op.action === 'json' || op.action === 'dependency' || op.action === 'script') return 1;
			if (op.action === 'move') return 2;
			return 3;
		};
		for (const op of [...applicable].sort((a, b) => order(a) - order(b))) applyOne(op);

		// ── Phase 3: tracking — INSIDE the rollback-protected try, as the
		// LAST write (#327): a failure here must roll the whole apply back,
		// never leave files upgraded with stale or absent tracking.
		writeTracking();
	} catch (error) {
		// ── Rollback: undo every completed write, newest first ──
		for (let i = journal.length - 1; i >= 0; i--) {
			const entry = journal[i];
			const full = safeProjectPath(projectRoot, entry.dest, 'rollback');
			try {
				if (entry.moveFrom !== undefined) {
					// A move wrote `to` and deleted `from` — reverse both halves.
					rmSync(full, { force: true });
					pruneEmptyDirs(projectRoot, dirname(full));
					const from = operationsSourcePath(plan, entry);
					if (from) {
						const fromFull = join(projectRoot, from);
						// The apply pruned the now-empty source parent dirs (#327):
						// recreate them FIRST, or this write dies with ENOENT —
						// swallowed by the best-effort catch below — and the source
						// file is silently LOST.
						mkdirSync(dirname(fromFull), { recursive: true });
						writeFileSync(fromFull, entry.moveFrom);
					}
				} else if (entry.existed) {
					const manifestPath = Object.keys(recipe.files).find((p) => resolveDestination(p, recipe.rootPaths) === entry.dest);
					// The apply may have PRUNED this file's parent dirs (a delete of
					// the last file in a nested directory, or the source half of a
					// move): recreate them FIRST, or this restore dies with ENOENT —
					// swallowed by the best-effort catch below — and the file is
					// silently LOST (same pattern as the move rollback above).
					mkdirSync(dirname(full), { recursive: true });
					// Restore from the SELECTED backup dir — on a same-second
					// collision that is the SUFFIXED directory, never the
					// unsuffixed backupBase (#327).
					const backupPath = selectedBackup ? join(selectedBackup, entry.dest) : undefined;
					if (backupPath && existsSync(backupPath)) copyFileSync(backupPath, full);
					else if (manifestPath) writeFileSync(full, recipe.files[manifestPath]);
				} else {
					rmSync(full, { force: true });
					pruneEmptyDirs(projectRoot, dirname(full));
				}
			} catch {
				// Best-effort rollback: keep unwinding the remaining entries.
			}
		}
		// Restore the tracking file to its exact pre-apply state (#327).
		try {
			if (trackingSnapshot === undefined) rmSync(trackingPath, { force: true });
			else writeFileSync(trackingPath, trackingSnapshot);
		} catch {
			// Best-effort: the journal unwind above already restored the files.
		}
		// The project is unchanged again — the fresh backup must not survive as
		// a stray claiming content that is no longer applied: remove the
		// SELECTED (possibly suffixed) directory, then prune its empty parents.
		if (selectedBackup) {
			try {
				rmSync(selectedBackup, { recursive: true, force: true });
				pruneEmptyDirs(projectRoot, dirname(selectedBackup));
			} catch {
				// Best-effort.
			}
		}
		return {
			dryRun: false,
			applied: 0,
			rolledBack: true,
			error: error instanceof Error ? error.message : String(error)
		};
	}

	return {
		dryRun: false,
		applied: applicable.length,
		rolledBack: false,
		...(backupDir ? { backupDir } : {})
	};
}

/** Recover a move's SOURCE path from the plan (rollback bookkeeping). */
function operationsSourcePath(plan: UpgradePlan, entry: JournalEntry): string | undefined {
	const op = plan.operations.find((candidate) => candidate.action === 'move' && candidate.to === entry.dest);
	return op?.from;
}
