<script lang="ts">
	import type { JSONContent } from '@tiptap/core';

	interface Props {
		content: JSONContent;
		class?: string;
	}

	let { content, class: className = '' }: Props = $props();

	/** Escape HTML special characters to prevent injection. */
	function escapeHtml(text: string): string {
		return text
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#39;');
	}

	/** Allowed link protocols. Anything else is stripped to prevent javascript: URLs. */
	const SAFE_PROTOCOLS = ['http:', 'https:', 'mailto:', 'tel:'];

	/** Sanitize an href: validate protocol and escape for attribute interpolation. */
	function sanitizeHref(href: string): string {
		if (!href) return '#';
		try {
			const url = new URL(href, 'http://placeholder.local');
			if (!SAFE_PROTOCOLS.includes(url.protocol)) {
				return '#';
			}
			return escapeHtml(url.href);
		} catch {
			// Relative URLs are OK, escape them
			return escapeHtml(href);
		}
	}

	function renderContent(node: JSONContent): string {
		if (!node) return '';

		const type = node.type;
		const nodeContent = node.content || [];
		const text = escapeHtml(node.text || '');
		const marks = node.marks || [];

		function applyMarks(text: string, marks: JSONContent['marks']): string {
			if (!marks) return text;
			return marks.reduce((acc, mark) => {
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
					case 'link': {
						const href = sanitizeHref(mark.attrs?.href || '#');
						const target = escapeHtml(mark.attrs?.target || '_blank');
						return `<a href="${href}" target="${target}" rel="noopener noreferrer">${acc}</a>`;
					}
					default:
						return acc;
				}
			}, text);
		}

		const children = nodeContent.map((child) => renderContent(child)).join('');

		switch (type) {
			case 'doc':
				return children;
			case 'paragraph':
				return `<p>${children || '<br>'}</p>`;
			case 'heading': {
				const level = node.attrs?.level || 1;
				return `<span class="tiptap-heading tiptap-heading-${level}">${children}</span>`;
			}
			case 'bulletList':
				return `<ul>${children}</ul>`;
			case 'orderedList':
				return `<ol>${children}</ol>`;
			case 'listItem':
				return `<li>${children}</li>`;
			case 'blockquote':
				return `<blockquote>${children}</blockquote>`;
			case 'codeBlock': {
				const language = node.attrs?.language || '';
				return `<pre><code class="language-${language}">${children}</code></pre>`;
			}
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

	const renderedHtml = $derived(renderContent(content));
</script>

<div class="tiptap-preview prose max-w-none {className}">
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	{@html renderedHtml}
</div>

<style>
	.tiptap-preview {
		line-height: 1.7;
	}

	.tiptap-preview :global(.tiptap-heading) {
		display: block;
		font-weight: 700;
		margin-bottom: 0.75rem;
		line-height: 1.2;
	}

	.tiptap-preview :global(.tiptap-heading-1) { font-size: 3rem; }
	.tiptap-preview :global(.tiptap-heading-2) { font-size: 2.25rem; }
	.tiptap-preview :global(.tiptap-heading-3) { font-size: 1.5rem; }
	.tiptap-preview :global(.tiptap-heading-4) { font-size: 1.25rem; }
	.tiptap-preview :global(.tiptap-heading-5) { font-size: 1.125rem; }
	.tiptap-preview :global(.tiptap-heading-6) { font-size: 1rem; }

	@media (min-width: 640px) {
		.tiptap-preview :global(.tiptap-heading-1) { font-size: 3.75rem; }
		.tiptap-preview :global(.tiptap-heading-2) { font-size: 3rem; }
		.tiptap-preview :global(.tiptap-heading-3) { font-size: 1.875rem; }
	}

	.tiptap-preview :global(p) { margin-bottom: 1rem; }
	.tiptap-preview :global(ul), .tiptap-preview :global(ol) { margin-left: 1.5rem; margin-bottom: 1rem; }
	.tiptap-preview :global(blockquote) {
		border-left: 4px solid var(--color-primary-500);
		padding-left: 1rem;
		font-style: italic;
	}
	.tiptap-preview :global(a) { color: var(--color-primary-500); text-decoration: underline; }
	.tiptap-preview :global(code) {
		background-color: oklch(from var(--color-surface-500) l c h / 0.1);
		padding: 0.125rem 0.375rem;
		border-radius: 0.25rem;
		font-size: 0.875em;
	}
	.tiptap-preview :global(pre) {
		background-color: var(--color-surface-900);
		color: var(--color-surface-100);
		padding: 1rem;
		border-radius: 0.5rem;
		overflow-x: auto;
	}
	.tiptap-preview :global(pre code) { background: none; padding: 0; }
</style>
