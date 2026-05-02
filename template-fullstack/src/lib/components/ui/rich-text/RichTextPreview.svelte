<script lang="ts">
	import type { JSONContent } from '@tiptap/core';

	interface Props {
		/** Tiptap JSON content to render */
		content: JSONContent;
		/** Additional CSS class */
		class?: string;
	}

	let { content, class: className = '' }: Props = $props();

	/** Lightweight JSON→HTML renderer. No Editor needed — zero runtime cost. */
	function renderNode(node: JSONContent): string {
		if (!node) return '';

		const children = (node.content ?? []).map((c) => renderNode(c)).join('');
		const text = node.text ?? '';
		const marks = node.marks ?? [];

		function applyMarks(t: string, m: JSONContent['marks']): string {
			if (!m) return t;
			return m.reduce((acc, mark) => {
				switch (mark.type) {
					case 'bold':
						return `<strong>${acc}</strong>`;
					case 'italic':
						return `<em>${acc}</em>`;
					case 'underline':
						return `<u>${acc}</u>`;
					case 'strike':
						return `<s>${acc}</s>`;
					case 'code':
						return `<code>${acc}</code>`;
					default:
						return acc;
				}
			}, t);
		}

		switch (node.type) {
			case 'doc':
				return children;
			case 'paragraph':
				return `<p>${children || '<br>'}</p>`;
			case 'heading': {
				const level = (node.attrs?.level as number) ?? 1;
				return `<h${level}>${children}</h${level}>`;
			}
			case 'bulletList':
				return `<ul>${children}</ul>`;
			case 'orderedList':
				return `<ol>${children}</ol>`;
			case 'listItem':
				return `<li>${children}</li>`;
			case 'blockquote':
				return `<blockquote>${children}</blockquote>`;
			case 'codeBlock':
				return `<pre><code>${children}</code></pre>`;
			case 'hardBreak':
				return '<br>';
			case 'horizontalRule':
				return '<hr>';
			case 'text':
				return applyMarks(text, marks);
			default:
				return children || text;
		}
	}

	const html = $derived(renderNode(content));
</script>

<div class="sf-rte-preview prose prose-slate max-w-none {className}">
	{@html html}
</div>

<style>
	.sf-rte-preview {
		line-height: 1.7;
	}

	.sf-rte-preview :global(h1) {
		font-size: 1.875rem;
		font-weight: 700;
		line-height: 1.2;
		margin-top: 1.5rem;
		margin-bottom: 0.5rem;
	}
	.sf-rte-preview :global(h2) {
		font-size: 1.5rem;
		font-weight: 700;
		line-height: 1.3;
		margin-top: 1.25rem;
		margin-bottom: 0.5rem;
	}
	.sf-rte-preview :global(h3) {
		font-size: 1.25rem;
		font-weight: 600;
		line-height: 1.4;
		margin-top: 1rem;
		margin-bottom: 0.5rem;
	}
	.sf-rte-preview :global(p) {
		margin-bottom: 0.75rem;
	}
	.sf-rte-preview :global(ul),
	.sf-rte-preview :global(ol) {
		margin-left: 1.5rem;
		margin-bottom: 0.75rem;
	}
	.sf-rte-preview :global(blockquote) {
		border-left: 3px solid var(--color-primary-500, #4f6d92);
		padding-left: 0.75rem;
		color: var(--color-surface-600-400, #4b5563);
	}
	.sf-rte-preview :global(code) {
		background-color: var(--color-surface-200-800, #e5e7eb);
		padding: 0.125rem 0.25rem;
		border-radius: 0.25rem;
		font-size: 0.875em;
	}
	.sf-rte-preview :global(pre) {
		background-color: var(--color-surface-900-100, #111827);
		color: var(--color-surface-100-900, #f3f4f6);
		padding: 0.75rem;
		border-radius: 0.375rem;
		overflow-x: auto;
	}
	.sf-rte-preview :global(pre code) {
		background: none;
		padding: 0;
	}
	.sf-rte-preview :global(hr) {
		border: none;
		border-top: 1px solid var(--color-surface-300-700, #d1d5db);
		margin: 1rem 0;
	}
	.sf-rte-preview :global(a) {
		color: var(--color-primary-500, #4f6d92);
		text-decoration: underline;
	}
</style>
