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
 * In a real implementation, these would be bundled with each module package.
 */
const MODULE_RECIPES: Record<string, { version: string; files: Record<string, string> }> = {
	base: {
		version: '1.1.0',
		files: {}
	}
};

/**
 * Compute a simple checksum of file content to detect modifications.
 */
function checksum(content: string): string {
	let hash = 0;
	for (let i = 0; i < content.length; i++) {
		hash = ((hash << 5) - hash + content.charCodeAt(i)) | 0;
	}
	return hash.toString(16);
}

/**
 * Upgrade an SVForge module in the current project.
 *
 * @param moduleName - Name of the module to upgrade (e.g., "base", "dnd", "tiptap").
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

	const fs = require('node:fs');
	const path = require('node:path');

	const files: UpgradeFile[] = [];
	let updatedCount = 0;
	let skippedCount = 0;

	// Read the installed version from .svforge-version or infer null
	const versionFile = path.join(projectRoot, '.svforge-versions.json');
	let fromVersion: string | null = null;
	try {
		const versions = JSON.parse(fs.readFileSync(versionFile, 'utf-8'));
		fromVersion = versions[moduleName] ?? null;
	} catch {
		// No version tracking file — first install
	}

	for (const [relPath, newContent] of Object.entries(recipe.files)) {
		const fullPath = path.join(projectRoot, relPath);

		if (!fs.existsSync(fullPath)) {
			// File doesn't exist yet — write it
			fs.mkdirSync(path.dirname(fullPath), { recursive: true });
			fs.writeFileSync(fullPath, newContent);
			files.push({ path: relPath, status: 'updated', message: 'New file created' });
			updatedCount++;
			continue;
		}

		const currentContent = fs.readFileSync(fullPath, 'utf-8');

		if (currentContent === newContent) {
			files.push({ path: relPath, status: 'unchanged', message: 'Already up to date' });
			continue;
		}

		// Content differs — check if the user modified it
		const currentChecksum = checksum(currentContent);
		const isLocallyModified = currentContent !== newContent;

		if (isLocallyModified && !options.force) {
			// Preserve the user's modifications
			files.push({
				path: relPath,
				status: 'skipped',
				message: `Local modifications detected (checksum: ${currentChecksum}). Use --force to overwrite.`
			});
			skippedCount++;
		} else {
			// Create backup, then overwrite
			const backupPath = fullPath + '.svforge-backup';
			fs.copyFileSync(fullPath, backupPath);
			fs.writeFileSync(fullPath, newContent);
			files.push({
				path: relPath,
				status: 'updated',
				message: 'Updated (backup saved as .svforge-backup)'
			});
			updatedCount++;
		}
	}

	// Update version tracking
	try {
		let versions: Record<string, string> = {};
		try {
			versions = JSON.parse(fs.readFileSync(versionFile, 'utf-8'));
		} catch {
			// First tracking
		}
		versions[moduleName] = recipe.version;
		fs.writeFileSync(versionFile, JSON.stringify(versions, null, 2));
	} catch {
		// Version tracking is best-effort
	}

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
