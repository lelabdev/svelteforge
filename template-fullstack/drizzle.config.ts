import type { Config } from 'drizzle-kit';

export default {
	schema: './src/lib/db/schemas/index.ts',
	out: './drizzle',
	dialect: 'sqlite',
	dbCredentials: {
		url: process.env.DATABASE_URL || 'data/sqlite.db'
	}
} satisfies Config;
