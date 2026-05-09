<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import { Editor } from '@tiptap/core';
	import StarterKit from '@tiptap/starter-kit';
	import Underline from '@tiptap/extension-underline';
	import type { JSONContent } from '@tiptap/core';
	import Icon from '../../icons/Icon.svelte';

	interface Props {
		/** Initial content as Tiptap JSON */
		content?: JSONContent;
		/** Called on every content change with the full JSON document */
		onUpdate?: (json: JSONContent) => void;
		/** Called when the editor gains focus */
		onFocus?: () => void;
		/** Called when the editor loses focus */
		onBlur?: () => void;
		/** Whether the editor is editable. Default: true */
		editable?: boolean;
		/** Placeholder text for empty editor */
		placeholder?: string;
		/** Additional CSS class */
		class?: string;
	}

	let {
		content,
		onUpdate,
		onFocus,
		onBlur,
		editable = true,
		placeholder = 'Start writing...',
		class: className = ''
	}: Props = $props();

	let editor = $state<Editor | null>(null);
	let editorEl = $state<HTMLElement | null>(null);

	onMount(() => {
		if (!browser || !editorEl) return;

		editor = new Editor({
			element: editorEl,
			extensions: [StarterKit, Underline],
			content: content ?? { type: 'doc', content: [{ type: 'paragraph' }] },
			editable,
			editorProps: {
				attributes: {
					class: `sf-rte__content prose prose-slate max-w-none focus:outline-none min-h-[120px] ${className}`,
					'data-placeholder': placeholder
				}
			},
			onUpdate: ({ editor: e }) => {
				onUpdate?.(e.getJSON());
			},
			onFocus: () => {
				onFocus?.();
			},
			onBlur: () => {
				onBlur?.();
			}
		});
	});

	// Sync external content changes
	$effect(() => {
		if (!editor || !content) return;
		const current = JSON.stringify(editor.getJSON());
		const incoming = JSON.stringify(content);
		if (current !== incoming) {
			editor.commands.setContent(content, { emitUpdate: false });
		}
	});

	onDestroy(() => {
		editor?.destroy();
	});

	// Toolbar helpers
	function isActive(type: string, attrs?: Record<string, unknown>): boolean {
		return editor?.isActive(type, attrs) ?? false;
	}

	function cmd(fn: (e: Editor) => void) {
		if (!editor) return;
		editor.chain().focus();
		fn(editor);
	}
</script>

<div class="sf-rte" class:sf-rte--disabled={!editable}>
	{#if editable}
		<!-- Toolbar -->
		<div class="sf-rte__toolbar">
			<!-- Text formatting -->
			<button
				type="button"
				class="sf-rte__btn {isActive('bold') ? 'sf-rte__btn--active' : ''}"
				onclick={() => cmd((e) => e.chain().focus().toggleBold().run())}
				title="Bold"
				aria-label="Bold"
			>
				<Icon name="bold" size={16} />
			</button>
			<button
				type="button"
				class="sf-rte__btn {isActive('italic') ? 'sf-rte__btn--active' : ''}"
				onclick={() => cmd((e) => e.chain().focus().toggleItalic().run())}
				title="Italic"
				aria-label="Italic"
			>
				<Icon name="italic" size={16} />
			</button>
			<button
				type="button"
				class="sf-rte__btn {isActive('underline') ? 'sf-rte__btn--active' : ''}"
				onclick={() => cmd((e) => e.chain().focus().toggleUnderline().run())}
				title="Underline"
				aria-label="Underline"
			>
				<Icon name="underline" size={16} />
			</button>
			<button
				type="button"
				class="sf-rte__btn {isActive('strike') ? 'sf-rte__btn--active' : ''}"
				onclick={() => cmd((e) => e.chain().focus().toggleStrike().run())}
				title="Strikethrough"
				aria-label="Strikethrough"
			>
				<Icon name="strikethrough" size={16} />
			</button>

			<div class="sf-rte__sep"></div>

			<!-- Headings -->
			{#each [1, 2, 3] as level}
				<button
					type="button"
					class="sf-rte__btn {isActive('heading', { level }) ? 'sf-rte__btn--active' : ''}"
					onclick={() => cmd((e) => e.chain().focus().toggleHeading({ level: level as 1 | 2 | 3 }).run())}
					title="Heading {level}"
					aria-label="Heading {level}"
				>
					H{level}
				</button>
			{/each}

			<div class="sf-rte__sep"></div>

			<!-- Lists -->
			<button
				type="button"
				class="sf-rte__btn {isActive('bulletList') ? 'sf-rte__btn--active' : ''}"
				onclick={() => cmd((e) => e.chain().focus().toggleBulletList().run())}
				title="Bullet list"
				aria-label="Bullet list"
			>
				<Icon name="list" size={16} />
			</button>
			<button
				type="button"
				class="sf-rte__btn {isActive('orderedList') ? 'sf-rte__btn--active' : ''}"
				onclick={() => cmd((e) => e.chain().focus().toggleOrderedList().run())}
				title="Ordered list"
				aria-label="Ordered list"
			>
				<Icon name="listOrdered" size={16} />
			</button>
			<button
				type="button"
				class="sf-rte__btn {isActive('blockquote') ? 'sf-rte__btn--active' : ''}"
				onclick={() => cmd((e) => e.chain().focus().toggleBlockquote().run())}
				title="Quote"
				aria-label="Quote"
			>
				<Icon name="quote" size={16} />
			</button>
			<button
				type="button"
				class="sf-rte__btn {isActive('codeBlock') ? 'sf-rte__btn--active' : ''}"
				onclick={() => cmd((e) => e.chain().focus().toggleCodeBlock().run())}
				title="Code block"
				aria-label="Code block"
			>
				<Icon name="code" size={16} />
			</button>

			<div class="sf-rte__sep"></div>

			<!-- Utilities -->
			<button
				type="button"
				class="sf-rte__btn"
				onclick={() => cmd((e) => e.chain().focus().setHorizontalRule().run())}
				title="Horizontal rule"
				aria-label="Horizontal rule"
			>
				<Icon name="minus" size={16} />
			</button>
			<button
				type="button"
				class="sf-rte__btn"
				onclick={() => cmd((e) => e.chain().focus().undo().run())}
				title="Undo"
				aria-label="Undo"
			>
				<Icon name="undo2" size={16} />
			</button>
			<button
				type="button"
				class="sf-rte__btn"
				onclick={() => cmd((e) => e.chain().focus().redo().run())}
				title="Redo"
				aria-label="Redo"
			>
				<Icon name="redo2" size={16} />
			</button>
		</div>
	{/if}

	<!-- Editor area -->
	<div bind:this={editorEl} class="sf-rte__body"></div>
</div>

<style>
	.sf-rte {
		display: flex;
		flex-direction: column;
		border-radius: var(--radius-input-custom, 0.5rem);
		border: 1px solid var(--color-surface-300-700, #d1d5db);
		overflow: hidden;
		transition: border-color 0.15s;
	}

	.sf-rte:focus-within {
		border-color: var(--color-primary-500, #4f6d92);
	}

	.sf-rte--disabled {
		opacity: 0.6;
		pointer-events: none;
	}

	/* Toolbar */
	.sf-rte__toolbar {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 2px;
		padding: var(--gap-xs, 0.25rem) var(--gap-sm, 0.5rem);
		background-color: var(--color-surface-100-900, #f3f4f6);
		border-bottom: 1px solid var(--color-surface-300-700, #d1d5db);
	}

	.sf-rte__btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		border-radius: var(--radius-icon-wrap, 0.375rem);
		border: none;
		background: transparent;
		color: var(--color-surface-600-400, #4b5563);
		cursor: pointer;
		font-size: 0.75rem;
		font-weight: 700;
		transition:
			background-color 0.15s,
			color 0.15s;
	}

	.sf-rte__btn:hover {
		background-color: var(--color-surface-200-800, #e5e7eb);
	}

	.sf-rte__btn--active {
		background-color: var(--color-primary-100-900, #dbeafe);
		color: var(--color-primary-600-400, #2563eb);
	}

	.sf-rte__sep {
		width: 1px;
		height: 1.25rem;
		background-color: var(--color-surface-300-700, #d1d5db);
		margin: 0 var(--gap-xs, 0.25rem);
	}

	/* Body */
	.sf-rte__body {
		padding: var(--gap-md, 0.75rem);
		min-height: 120px;
	}

	/* Placeholder */
	.sf-rte__content:empty::before {
		content: attr(data-placeholder);
		color: var(--color-surface-400-600, #9ca3af);
		pointer-events: none;
		float: left;
		height: 0;
	}

	/* Prose overrides for consistent spacing */
	.sf-rte__body :global(h1) {
		font-size: 1.875rem;
		font-weight: 700;
		line-height: 1.2;
		margin-top: 1.5rem;
		margin-bottom: 0.5rem;
	}
	.sf-rte__body :global(h2) {
		font-size: 1.5rem;
		font-weight: 700;
		line-height: 1.3;
		margin-top: 1.25rem;
		margin-bottom: 0.5rem;
	}
	.sf-rte__body :global(h3) {
		font-size: 1.25rem;
		font-weight: 600;
		line-height: 1.4;
		margin-top: 1rem;
		margin-bottom: 0.5rem;
	}
	.sf-rte__body :global(p) {
		margin-bottom: 0.5rem;
	}
	.sf-rte__body :global(ul),
	.sf-rte__body :global(ol) {
		margin-left: 1.5rem;
		margin-bottom: 0.5rem;
	}
	.sf-rte__body :global(blockquote) {
		border-left: 3px solid var(--color-primary-500, #4f6d92);
		padding-left: 0.75rem;
		margin: 0.5rem 0;
		color: var(--color-surface-500, #6b7280);
	}
	.sf-rte__body :global(pre) {
		background-color: var(--color-surface-900-100, #111827);
		color: var(--color-surface-100-900, #f3f4f6);
		padding: 0.75rem;
		border-radius: 0.375rem;
		overflow-x: auto;
		font-size: 0.875rem;
	}
	.sf-rte__body :global(code) {
		background-color: var(--color-surface-200-800, #e5e7eb);
		padding: 0.125rem 0.25rem;
		border-radius: 0.25rem;
		font-size: 0.875em;
	}
	.sf-rte__body :global(pre code) {
		background: none;
		padding: 0;
	}
	.sf-rte__body :global(hr) {
		border: none;
		border-top: 1px solid var(--color-surface-300-700, #d1d5db);
		margin: 1rem 0;
	}
</style>
