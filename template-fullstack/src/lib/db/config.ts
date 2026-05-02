/**
 * Database configuration module
 * Separated from connection logic for better testability
 */

export interface DatabaseConfig {
	databaseUrl: string;
}

/**
 * Require an environment variable to be set
 * Uses SvelteKit $env/static/private when available, falls back to process.env
 * @throws Error if the environment variable is not defined
 */
export function requireEnv(key: string): string {
	// In SvelteKit, env vars are available via import.meta.env or process.env
	const value = import.meta.env?.[key] ?? process.env?.[key];

	if (!value) {
		// Development defaults for certain keys
		const devDefaults: Record<string, string> = {
			DATABASE_URL: 'data/sqlite.db',
			BETTER_AUTH_SECRET: 'dev-secret-change-in-production',
			BASE_URL: 'http://localhost:5173'
		};

		if (devDefaults[key] && import.meta.env?.DEV === true) {
			return devDefaults[key];
		}

		throw new Error(`Environment variable ${key} is required but not set`);
	}
	return value;
}

let cachedConfig: DatabaseConfig | null = null;

/**
 * Get database configuration
 * In production: reads from environment variables
 * In tests: can use setTestConfig() to override
 */
export function getDatabaseConfig(): DatabaseConfig {
	// First, check if test config is set
	if (cachedConfig) {
		return cachedConfig;
	}

	// Try to get from environment via SvelteKit's Vite env
	const databaseUrl = import.meta.env?.DATABASE_URL || process.env?.DATABASE_URL;

	if (databaseUrl) {
		return { databaseUrl };
	}

	// Fallback for development: local SQLite file
	cachedConfig = {
		databaseUrl: 'data/sqlite.db'
	};

	return cachedConfig;
}

/**
 * Set a test configuration (for testing purposes only)
 * This allows tests to override the database URL without touching process.env
 */
export function setTestConfig(config: DatabaseConfig): void {
	cachedConfig = config;
}

/**
 * Reset cached configuration (for testing purposes)
 */
export function resetConfig(): void {
	cachedConfig = null;
}

/**
 * Validate database URL format
 * For SQLite, we accept a file path (relative or absolute)
 * @throws Error if the URL format is invalid
 */
export function validateDatabaseUrl(url: string): void {
	if (!url) {
		throw new Error('DATABASE_URL is not defined');
	}

	// Remove file: prefix if present (bun:sqlite doesn't need it)
	url = url.replace(/^file:/i, '');

	// Detect common configuration error where the variable name is included in the value
	if (url.startsWith('DATABASE_URL=')) {
		throw new Error(
			'DATABASE_URL should not include "DATABASE_URL=" prefix. ' +
				'Please check your environment variable configuration.'
		);
	}

	// For SQLite, we accept file paths
	if (url.startsWith('postgres://') || url.startsWith('postgresql://')) {
		throw new Error(
			'DATABASE_URL should be a SQLite file path (e.g., "./sqlite.db"), not a PostgreSQL URL. ' +
				`Got: ${url.substring(0, 20)}...`
		);
	}
}
