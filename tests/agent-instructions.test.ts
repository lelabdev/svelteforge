import { describe, it, expect } from 'vitest';
import type { SvApi } from 'sv';
import { agentInstructionFiles } from '../packages/svforge/src/scaffolded-agents';
import { applyBaseMode } from '../packages/svforge/src/modes/base';
import { applyDashboardMode } from '../packages/svforge/src/modes/dashboard';

/**
 * #347 — Agent instruction support.
 *
 * Strategy: agent-agnostic. `AGENTS.md` is the canonical file; every other
 * instruction file (CLAUDE.md, .github/copilot-instructions.md,
 * .cursor/rules/svforge.mdc) is a GENERATED BRIDGE derived from the same
 * single source, so variants cannot drift. Instructions are advisory; the
 * mechanical enforcement stays `svforge check`.
 */

const EXPECTED_FILES = [
	'AGENTS.md',
	'CLAUDE.md',
	'.github/copilot-instructions.md',
	'.cursor/rules/svforge.mdc'
];

describe('agent instruction files (#347)', () => {
	it('generates exactly the documented instruction files', () => {
		const files = agentInstructionFiles('base');
		expect(Object.keys(files).sort()).toEqual([...EXPECTED_FILES].sort());
	});

	it('keeps AGENTS.md as the canonical full-content source', () => {
		const files = agentInstructionFiles('base');
		expect(files['AGENTS.md']).toContain('# AGENTS.md');
		expect(files['AGENTS.md']).toContain('svforge check');
	});

	it('bridges Claude Code through an @AGENTS.md import, not duplicated content', () => {
		// Claude Code officially reads CLAUDE.md, NOT AGENTS.md — and CLAUDE.md
		// supports @path imports. The bridge must be a one-line import so the
		// canonical file stays the single source of truth.
		const claude = agentInstructionFiles('base')['CLAUDE.md'];
		expect(claude).toMatch(/@AGENTS\.md/);
		expect(claude.length).toBeLessThan(300);
		expect(claude).not.toContain('Positioning');
	});

	it('derives the Copilot instructions from the canonical AGENTS.md content', () => {
		// GitHub Copilot reads .github/copilot-instructions.md and has no
		// AGENTS.md import mechanism — the content itself must be derived.
		const files = agentInstructionFiles('base');
		expect(files['.github/copilot-instructions.md']).toContain(files['AGENTS.md']);
		expect(files['.github/copilot-instructions.md']).toMatch(/copilot-instructions/i);
	});

	it('derives the Cursor rule from the canonical AGENTS.md content', () => {
		// Cursor loads .cursor/rules/*.mdc; alwaysApply makes the rule global.
		const rule = agentInstructionFiles('base')['.cursor/rules/svforge.mdc'];
		expect(rule).toMatch(/^---\n[\s\S]*alwaysApply:\s*true[\s\S]*---\n/);
		expect(rule).toContain(agentInstructionFiles('base')['AGENTS.md']);
	});

	it('propagates the dashboard golden references to every variant', () => {
		const files = agentInstructionFiles('dashboard');
		for (const key of EXPECTED_FILES) {
			const content = files[key];
			if (key === 'CLAUDE.md') {
				expect(content).toMatch(/@AGENTS\.md/);
			} else {
				expect(content).toContain('Golden references');
			}
		}
	});

	it('explicitly separates advisory instructions from enforced checks', () => {
		const canonical = agentInstructionFiles('base')['AGENTS.md'];
		expect(canonical).toMatch(/advisory/i);
		expect(canonical).toMatch(/svforge check/);
	});
});

type FakeSv = {
	dependencies: string[];
	devDependencies: string[];
	files: Map<string, string>;
	dependency: (name: string, version: string) => void;
	devDependency: (name: string, version: string) => void;
	file: (path: string, transform: (content: string) => string) => void;
};

function fakeSv(): FakeSv {
	const sv: FakeSv = {
		dependencies: [],
		devDependencies: [],
		files: new Map(),
		dependency(name) {
			this.dependencies.push(name);
		},
		devDependency(name) {
			this.devDependencies.push(name);
		},
		file(path, transform) {
			this.files.set(path, transform(path === 'package.json' ? '{"scripts":{}}' : ''));
		}
	};
	return sv;
}

// FakeSv implements the SvApi surface the modes actually use; the unused
// required SvApi members are stubbed out at this single boundary.
const asSvApi = (sv: FakeSv): SvApi => sv as unknown as SvApi;

describe('scaffold writes every agent instruction file (#347)', () => {
	it('base mode writes all instruction files at the project root', () => {
		const sv = fakeSv();
		applyBaseMode(asSvApi(sv), { '/lib/base.ts': 'base' });
		for (const file of EXPECTED_FILES) {
			expect(sv.files.get(file), `${file} must be scaffolded`).toBeTruthy();
		}
	});

	it('dashboard mode writes all instruction files at the project root', () => {
		const sv = fakeSv();
		applyDashboardMode(asSvApi(sv), { '/lib/base.ts': 'base' }, {}, 'vitest');
		for (const file of EXPECTED_FILES) {
			expect(sv.files.get(file), `${file} must be scaffolded`).toBeTruthy();
		}
	});
});
