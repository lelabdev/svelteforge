/**
 * Canonical destination model for the svforge recipes (#327).
 *
 * ONE source of truth for "which manifest paths are delivered at the project
 * ROOT instead of under src/". The scaffold modes (`modes/*.ts`) and the
 * upgrade engine (`upgrade.ts`) both resolve destinations through
 * `resolveDestination` + these lists, so a file can never be delivered in two
 * different places by install and upgrade.
 */
import { baseRootFiles, dashboardRootFiles } from './templates';

/** Base: the Vitest config lives at the root (#235) + the Paraglide/design-system root files (#239, #187). */
export const BASE_ROOT_PATHS: string[] = ['/vitest.config.ts', ...Object.keys(baseRootFiles)];

/**
 * Dashboard: test configs at the root (#186) — `/e2e/` is a directory prefix —
 * plus EVERY root-delivered file the recipe ships: the base root files
 * (Paraglide, checker, ESLint tooling — #239) and the dashboard root files
 * (#187: drizzle.config.ts, .env.example, scripts/setup.sh, static/robots.txt).
 */
export const DASHBOARD_ROOT_PATHS: string[] = [
	'/vitest.config.ts',
	'/playwright.config.ts',
	'/e2e/',
	...Object.keys(baseRootFiles),
	...Object.keys(dashboardRootFiles)
];
