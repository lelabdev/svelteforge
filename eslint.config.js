import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';

export default tseslint.config(
	{
		// Repository source code only. Files under templates/ are scaffolded
		// into user projects and are validated by the scaffold tests, not by
		// the repository lint gate. tests/__gen__/ holds generated fixtures.
		ignores: [
			'**/node_modules/**',
			'**/dist/**',
			'**/templates/**',
			'**/docs/**',
			'**/*.md',
			'tests/__gen__/**'
		]
	},
	js.configs.recommended,
	...tseslint.configs.recommended,
	{
		files: ['**/*.ts', '**/*.mts', '**/*.mjs'],
		languageOptions: {
			globals: {
				...globals.node
			}
		},
		rules: {
			'@typescript-eslint/no-unused-vars': [
				'error',
				{ argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrors: 'none' }
			],
			'@typescript-eslint/no-require-imports': 'error'
		}
	},
	{
		// Deliberate exception: doctor.ts runs under Bun, which supports
		// require() inside ESM. Each diagnostic performs its own local
		// require so a missing module fails in isolation instead of breaking
		// the whole doctor run.
		files: ['packages/svforge/src/doctor.ts'],
		rules: {
			'@typescript-eslint/no-require-imports': 'off'
		}
	},
	{
		// Deliberate exception for test files only: tests intentionally use
		// loose types when inspecting generated output and synchronous
		// require() to load compiled fixtures. Production code keeps the
		// strict rules above.
		files: ['tests/**/*.ts'],
		rules: {
			'@typescript-eslint/no-explicit-any': 'off',
			'@typescript-eslint/no-require-imports': 'off'
		}
	}
);
