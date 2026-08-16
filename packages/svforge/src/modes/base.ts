import type { SvApi } from 'sv';
import { scaffoldedAgents } from '../scaffolded-agents';

/**
 * Apply Base mode files via sv.file()
 * Base = all UI components, layouts, styles, utils, schemas
 */
export function applyBaseMode(
	sv: SvApi,
	files: Record<string, string>
): void {
	// Write all base template files
	for (const [path, content] of Object.entries(files)) {
		sv.file(`src${path}`, () => content);
	}

	// AI-ready: scaffold an AGENTS.md at the project root (#203)
	sv.file('AGENTS.md', () => scaffoldedAgents('base'));
}
