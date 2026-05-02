/**
 * Database configuration module
 * Separated from connection logic for better testability
 */

export interface DatabaseConfig {
	databaseUrl: string;
}

/**
 * Require an environment variable to be set
 * In development, provides sensible defaults for certain keys
 * @throws Error if the environment variable is not defined
 */
export function requireEnv(key: string): string {
	const value = typeof process !== 'undefined' ? process.env?.[key] : undefined;

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

	// Try to get from environment
	if (typeof process !== 'undefined' && process.env?.DATABASE_URL) {
		return {
			databaseUrl: process.env.DATABASE_URL
		};
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
	// Could be "./sqlite.db", "/path/to/db.sqlite", "sqlite.db", etc.
	// Just ensure it's not trying to use a postgres:// URL
	if (url.startsWith('postgres://') || url.startsWith('postgresql://')) {
		throw new Error(
			'DATABASE_URL should be a SQLite file path (e.g., "./sqlite.db"), not a PostgreSQL URL. ' +
				`Got: ${url.substring(0, 20)}...`
		);
	}
}
