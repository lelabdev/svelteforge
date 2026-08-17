<script lang="ts">
	import type { JSONContent } from '@tiptap/core';
	import { renderTiptap } from './render-tiptap';

	interface Props {
		content: JSONContent;
		class?: string;
	}

	let { content, class: className = '' }: Props = $props();

	// The sanitization lives in the pure renderTiptap() function (#282) — every
	// document-controlled value is escaped or allowlisted there before reaching
	// the {@html} output. The .svelte itself must never interpolate
	// document attributes into HTML.
	const renderedHtml = $derived(renderTiptap(content));
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
