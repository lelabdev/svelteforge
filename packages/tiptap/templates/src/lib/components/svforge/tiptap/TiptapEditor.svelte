<script lang="ts">
	import type { JSONContent } from '@tiptap/core';
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import TiptapToolbar from './TiptapToolbar.svelte';

	interface Props {
		content: JSONContent;
		onUpdate?: (content: JSONContent) => void;
		class?: string;
	}

	let { content, onUpdate, class: className = '' }: Props = $props();

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let editorInstance: any = $state(null);
	let editorElement: HTMLElement;
	let loading = $state(true);

	onMount(async () => {
		if (!browser) return;

		try {
			const [coreModule, starterKitModule, extensionsModule] = await Promise.all([
				import('@tiptap/core'),
				import('@tiptap/starter-kit'),
				import('./tiptap-extensions')
			]);

			const EditorClass = coreModule.Editor;
			const StarterKit = starterKitModule.default;
			const { Gradient, VisualHeading } = extensionsModule;

			editorInstance = new EditorClass({
				element: editorElement,
				extensions: [
					StarterKit.configure({ heading: false }),
					Gradient,
					VisualHeading
				],
				content: content,
				editorProps: {
					attributes: {
						class: 'prose focus:outline-none min-h-[300px] max-w-none p-4'
					}
				},
				onUpdate: ({ editor }: { editor: typeof editorInstance }) => {
					onUpdate?.(editor.getJSON());
				}
			});
		} catch (error) {
			console.error('Failed to load Tiptap editor:', error);
		} finally {
			loading = false;
		}
	});

	onDestroy(() => {
		if (editorInstance) {
			editorInstance.destroy();
			editorInstance = null;
		}
	});

	const actions = {
		toggleBold: () => editorInstance?.chain().focus().toggleBold().run(),
		toggleItalic: () => editorInstance?.chain().focus().toggleItalic().run(),
		toggleGradient: () => editorInstance?.chain().focus().toggleGradient().run(),
		setHeading: (level: 1 | 2 | 3) =>
			editorInstance?.chain().focus().toggleVisualHeading({ level }).run(),
		isActive: (type: string, attrs?: Record<string, unknown>) =>
			editorInstance?.isActive(type, attrs) ?? false
	};
</script>

<div class="rounded-xl overflow-hidden border border-surface-200-800 bg-surface-50-950 {className}">
	<TiptapToolbar
		{loading}
		isActive={actions.isActive}
		onToggleBold={actions.toggleBold}
		onToggleItalic={actions.toggleItalic}
		onToggleGradient={actions.toggleGradient}
		onSetHeading={actions.setHeading}
	/>

	<div class="min-h-[300px] relative" bind:this={editorElement} class:opacity-50={loading}>
		{#if loading}
			<div class="absolute inset-0 flex items-center justify-center">
				<div class="w-8 h-8 border-3 border-surface-200-800 border-t-primary-500 rounded-full animate-spin"></div>
			</div>
		{/if}
	</div>
</div>
