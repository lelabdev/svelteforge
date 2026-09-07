import path from 'node:path';
import {
	DESIGN_MESSAGES,
	DESIGN_RULE_IDS,
	duplicatedSkeletonPrimitiveName,
	isForbiddenUiKit
} from 'svforge';

type RuleContext = {
	filename: string;
	cwd: string;
	report(problem: { node: unknown; messageId: string; data: Record<string, string> }): void;
};

const rule = {
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
	create(context: RuleContext) {
		return {
			ImportDeclaration(node: { source: { value: unknown } }) {
				if (typeof node.source.value !== 'string' || !isForbiddenUiKit(node.source.value)) return;
				context.report({
					node,
					messageId: DESIGN_RULE_IDS.forbiddenUiKit,
					data: { kit: node.source.value }
				});
			},
			Program(node: unknown) {
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

export default {
	meta: { name: 'eslint-plugin-svforge' },
	rules: { 'no-design-violations': rule }
};
