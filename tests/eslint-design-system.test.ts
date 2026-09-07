import { describe, expect, it } from 'vitest';
import { ESLint } from 'eslint';
import svelte from 'eslint-plugin-svelte';
import svforge from '../packages/eslint-plugin-svforge/src/index';

const eslint = new ESLint({
	overrideConfigFile: true,
	overrideConfig: [
		...svelte.configs.recommended,
		{
			files: ['**/*.{js,ts,svelte}'],
			plugins: { svforge },
			rules: { 'svforge/no-design-violations': 'error' }
		}
	]
});

describe('svforge ESLint design-system rule (#346)', () => {
	it('reports forbidden UI kit imports in JavaScript and TypeScript with the shared identifier', async () => {
		for (const filePath of ['eslint.config.js', 'src/lib/config.ts']) {
			const [message] = await eslint.lintText("import { Dialog } from 'bits-ui';", { filePath });
			expect(message.errorCount).toBe(1);
			expect(message.messages[0]).toMatchObject({
				ruleId: 'svforge/no-design-violations',
				messageId: 'forbiddenUiKit'
			});
			expect(message.messages[0].message).toContain('Second UI kit detected: bits-ui');
		}
	});

	it('reports a duplicated Skeleton primitive in Svelte at the component location', async () => {
		const [result] = await eslint.lintText('<div>custom dialog</div>', {
			filePath: 'src/lib/features/Dialog.svelte'
		});
		expect(result.errorCount).toBe(1);
		expect(result.messages[0]).toMatchObject({
			ruleId: 'svforge/no-design-violations',
			messageId: 'duplicatedSkeletonPrimitive',
			line: 1,
			column: 1
		});
		expect(result.messages[0].message).toContain('Duplicated Skeleton primitive "Dialog"');
	});
});
