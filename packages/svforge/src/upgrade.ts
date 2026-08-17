/**
 * SVForge Upgrade — explicit, reviewable module upgrades.
 *
 * Installed SVForge source files are intentionally owned by each project.
 * Users need an explicit upgrade workflow that detects local modifications
 * and presents a safe result before changing files.
 *
 * This command is never automatic — it requires an explicit module name
 * and preserves modified files unless `--force` is passed.
 */

import { readFileSync, existsSync, writeFileSync, mkdirSync, copyFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { baseFiles, dashboardFiles } from './templates';
import { SDFORGE_RECIPE_VERSION } from './recipe-version';

/** A single file in an upgrade operation. */
export interface UpgradeFile {
	/** Relative path within the project. */
	path: string;
	/** Upgrade status for this file. */
	status: 'updated' | 'unchanged' | 'skipped' | 'conflict';
	/** Human-readable detail. */
	message: string;
}

/** Result of an upgrade operation. */
export interface UpgradeResult {
	/** Module that was upgraded. */
	module: string;
	/** Recipe version installed before the upgrade. */
	fromVersion: string | null;
	/** Recipe version applied by the upgrade. */
	toVersion: string;
	/** Per-file results. */
	files: UpgradeFile[];
	/** Number of files that were actually changed. */
	updatedCount: number;
	/** Number of files skipped due to local modifications. */
	skippedCount: number;
}

/**
 * Known SVForge modules and their recipe files.
 *
 * Recipes are generated from the EMBEDDED template manifests (#189): base
 * ships src/** from templates/base/src, dashboard = base + dashboard overlay.
 * Module addon recipes (blog, dnd, …) are embedded in their own packages;
 * the base/dashboard recipes live here since this is the main addon.
 */
export const MODULE_RECIPES: Record<string, { version: string; files: Record<string, string> }> = {
	// Recipe version is derived from the addon package version at prebuild time
	// (#283) — it cannot drift from the actually shipped template/package.
	base: {
		version: SDFORGE_RECIPE_VERSION,
		files: baseFiles
	},
	dashboard: {
		version: SDFORGE_RECIPE_VERSION,
		files: { ...baseFiles, ...dashboardFiles }
	}
};

/** Compute a simple checksum of file content to detect modifications. */
export function checksum(content: string): string {
	let hash = 0;
	for (let i = 0; i < content.length; i++) {
		hash = ((hash << 5) - hash + content.charCodeAt(i)) | 0;
	}
	return hash.toString(16);
}

/** Tracking file: installed version + per-file checksums of the last install. */
const TRACKING_FILE = '.svforge-versions.json';

interface TrackingState {
	[module: string]: {
		version: string;
		/** path → checksum of the content we installed */
		fileChecksums?: Record<string, string>;
	};
}

function loadTracking(projectRoot: string): TrackingState {
	try {
		return JSON.parse(readFileSync(join(projectRoot, TRACKING_FILE), 'utf-8'));
	} catch {
		return {};
	}
}

function saveTracking(projectRoot: string, state: TrackingState): void {
	writeFileSync(join(projectRoot, TRACKING_FILE), JSON.stringify(state, null, 2) + '\n');
}

/**
 * Upgrade an SVForge module in the current project.
 *
 * @param moduleName - Name of the module to upgrade (e.g., "base", "dashboard").
 * @param projectRoot - Absolute path to the project root.
 * @param options - Force overwrite of locally modified files.
 * @returns Structured upgrade result.
 */
export async function upgrade(
	moduleName: string,
	projectRoot: string = process.cwd(),
	options: { force?: boolean } = {}
): Promise<UpgradeResult> {
	const recipe = MODULE_RECIPES[moduleName];
	if (!recipe) {
		throw new Error(
			`Unknown module: "${moduleName}". Available: ${Object.keys(MODULE_RECIPES).join(', ')}`
		);
	}

	const files: UpgradeFile[] = [];
	let updatedCount = 0;
	let skippedCount = 0;

	const tracking = loadTracking(projectRoot);
	const installed = tracking[moduleName];
	const fromVersion = installed?.version ?? null;
	// Checksums of what WE last installed — the baseline to detect user edits (#189).
	const installedChecksums = installed?.fileChecksums ?? {};
	// New baseline: only files actually written by THIS operation get a new
	// checksum; skipped/conflict files keep their previous baseline (or none),
	// so the next upgrade still treats them as potentially modified (#283).
	const newChecksums: Record<string, string> = { ...installedChecksums };

	for (const [manifestPath, newContent] of Object.entries(recipe.files)) {
		// Manifest paths start with "/" and are src-relative (e.g. "/lib/ui/Button.svelte").
		// In a scaffolded project they live under src/ (#187 layout).
		const relPath = `src${manifestPath}`;
		const fullPath = join(projectRoot, relPath);

		if (!existsSync(fullPath)) {
			// File doesn't exist yet — write it
			mkdirSync(dirname(fullPath), { recursive: true });
			writeFileSync(fullPath, newContent);
			files.push({ path: relPath, status: 'updated', message: 'New file created' });
			newChecksums[manifestPath] = checksum(newContent);
			updatedCount++;
			continue;
		}

		const currentContent = readFileSync(fullPath, 'utf-8');
		const currentChecksum = checksum(currentContent);

		if (currentContent === newContent) {
			files.push({ path: relPath, status: 'unchanged', message: 'Already up to date' });
			newChecksums[manifestPath] = currentChecksum;
			continue;
		}

		// Detect a LOCAL MODIFICATION: the file differs from what we installed
		// last time (installedChecksums), not merely from the new template.
		// Without a baseline (first upgrade, or file not tracked), ANY
		// divergence from the template is a potential user edit (#283) —
		// never overwrite it silently.
		const baseline = installedChecksums[manifestPath];
		const isUserModified = baseline === undefined || currentChecksum !== baseline;

		if (isUserModified && !options.force) {
			files.push({
				path: relPath,
				status: 'skipped',
				message: 'Local modifications detected (or no install baseline). Use --force to overwrite.'
			});
			skippedCount++;
			// baseline kept (previous value, or absent) — do NOT record the new
			// template checksum for a file that was not written.
		} else {
			// Create backup, then overwrite
			const backupPath = `${fullPath}.svforge-backup`;
			copyFileSync(fullPath, backupPath);
			writeFileSync(fullPath, newContent);
			files.push({
				path: relPath,
				status: 'updated',
				message: 'Updated (backup saved as .svforge-backup)'
			});
			newChecksums[manifestPath] = checksum(newContent);
			updatedCount++;
		}
	}

	// Update version tracking with the NEW per-file checksums (files skipped
	// or in conflict keep their previous baseline — or none).
	saveTracking(projectRoot, {
		...tracking,
		[moduleName]: {
			version: recipe.version,
			fileChecksums: newChecksums
		}
	});

	return {
		module: moduleName,
		fromVersion,
		toVersion: recipe.version,
		files,
		updatedCount,
		skippedCount
	};
}

/** Print an upgrade result to the console. */
export function printUpgradeResult(result: UpgradeResult): void {
	console.log(`\n SVForge Upgrade: ${result.module}\n`);
	console.log(`  Version: ${result.fromVersion ?? 'none'} → ${result.toVersion}\n`);

	for (const file of result.files) {
		const icon =
			file.status === 'updated' ? '✓' :
			file.status === 'unchanged' ? '=' :
			file.status === 'skipped' ? '⚠' :
			'✗';
		console.log(`  ${icon} ${file.path} — ${file.message}`);
	}

	console.log(
		`\n  ${result.updatedCount} file(s) updated, ${result.skippedCount} skipped.\n`
	);
}
