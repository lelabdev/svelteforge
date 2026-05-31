/**
 * SVForge Tiptap Extensions
 */
import { Mark, Node, mergeAttributes } from '@tiptap/core';

// ============================================================
// Gradient Mark - Text with gradient colors
// ============================================================

export interface GradientOptions {
	HTMLAttributes: Record<string, string>;
}

declare module '@tiptap/core' {
	interface Commands<ReturnType> {
		gradient: {
			setGradient: () => ReturnType;
			unsetGradient: () => ReturnType;
			toggleGradient: () => ReturnType;
		};
	}
}

export const Gradient = Mark.create<GradientOptions>({
	name: 'gradient',

	addOptions() {
		return {
			HTMLAttributes: {
				class:
					'text-transparent bg-clip-text bg-gradient-to-r from-primary-300 via-primary-400 to-primary-500'
			}
		};
	},

	parseHTML() {
		return [{ tag: 'span[data-gradient]' }];
	},

	renderHTML({ HTMLAttributes }) {
		return [
			'span',
			mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, { 'data-gradient': '' }),
			0
		];
	},

	addCommands() {
		return {
			setGradient:
				() =>
				({ commands }) => {
					return commands.setMark(this.name);
				},
			unsetGradient:
				() =>
				({ commands }) => {
					return commands.unsetMark(this.name);
				},
			toggleGradient:
				() =>
				({ commands }) => {
					return commands.toggleMark(this.name);
				}
		};
	}
});

// ============================================================
// Visual Heading - Non-semantic heading (span with class)
// ============================================================

export interface VisualHeadingOptions {
	HTMLAttributes: Record<string, string>;
	levels: number[];
}

declare module '@tiptap/core' {
	interface Commands<ReturnType> {
		visualHeading: {
			setVisualHeading: (attributes: { level: number }) => ReturnType;
			toggleVisualHeading: (attributes: { level: number }) => ReturnType;
			unsetVisualHeading: () => ReturnType;
		};
	}
}

export const VisualHeading = Node.create<VisualHeadingOptions>({
	name: 'heading',

	addOptions() {
		return {
			HTMLAttributes: {},
			levels: [1, 2, 3, 4, 5, 6]
		};
	},

	content: 'inline*',
	group: 'block',
	defining: true,

	addAttributes() {
		return {
			level: {
				default: 1,
				rendered: false
			}
		};
	},

	parseHTML() {
		return this.options.levels.map((level) => ({
			tag: `h${level}`,
			attrs: { level }
		}));
	},

	renderHTML({ node, HTMLAttributes }) {
		const level = node.attrs.level as number;
		return [
			'span',
			mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
				class: `tiptap-heading tiptap-heading-${level}`
			}),
			0
		];
	},

	addCommands() {
		return {
			setVisualHeading:
				(attributes) =>
				({ commands }) => {
					if (!this.options.levels.includes(attributes.level)) {
						return false;
					}
					return commands.setNode(this.name, attributes);
				},
			toggleVisualHeading:
				(attributes) =>
				({ commands }) => {
					if (!this.options.levels.includes(attributes.level)) {
						return false;
					}
					return commands.toggleNode(this.name, 'paragraph', attributes);
				},
			unsetVisualHeading:
				() =>
				({ commands }) => {
					return commands.setNode('paragraph');
				}
		};
	}
});
