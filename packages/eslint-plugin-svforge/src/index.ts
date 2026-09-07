import path from 'node:path';
import type { ESLint, Rule } from 'eslint';
import {
	DESIGN_MESSAGES,
	DESIGN_RULE_IDS,
	duplicatedSkeletonPrimitiveName,
	isForbiddenUiKit
} from 'svforge';

const rule: Rule.RuleModule = {
	meta: {
		type: 'problem',
		docs: {
			description: 'report deterministic SvelteForge design-system violations'
		},
		messages: {
			[DESIGN_RULE_IDS.forbiddenUiKit]: DESIGN_MESSAGES.forbiddenUiKit('{{kit}}'),
			[DESIGN_RULE_IDS.duplicatedSkeletonPrimitive]: DESIGN_MESSAGES.duplicatedSkeletonPrimitive('{{name}}', '{{file}}')
		},
		schema: []
	},
	create(context) {
		return {
			ImportDeclaration(node) {
				if (typeof node.source.value !== 'string' || !isForbiddenUiKit(node.source.value)) return;
				context.report({
					node,
					messageId: DESIGN_RULE_IDS.forbiddenUiKit,
					data: { kit: node.source.value }
				});
			},
			Program(node) {
				const filename = context.filename;
				if (!filename.endsWith('.svelte')) return;
				const primitive = duplicatedSkeletonPrimitiveName(filename, context.cwd);
				if (!primitive) return;
				context.report({
					node,
					messageId: DESIGN_RULE_IDS.duplicatedSkeletonPrimitive,
					data: { name: primitive, file: path.relative(context.cwd, filename) }
				});
			}
		};
	}
};

const plugin: ESLint.Plugin = {
	meta: { name: 'eslint-plugin-svforge' },
	rules: { 'no-design-violations': rule }
};

export default plugin;
