<script lang="ts">
	import { Dialog, Portal } from '@skeletonlabs/skeleton-svelte';
	import type { Snippet } from 'svelte';

	interface Props {
		open: boolean;
		title: string;
		onClose: () => void;
		size?: 'sm' | 'md' | 'lg' | 'xl';
		children?: Snippet;
	}

	let { open, title, onClose, size = 'md', children }: Props = $props();

	const sizeClasses: Record<string, string> = {
		sm: 'max-w-sm',
		md: 'max-w-md',
		lg: 'max-w-lg',
		xl: 'max-w-xl'
	};
</script>

<Dialog open={open} onOpenChange={(e) => { if (!e.open) onClose(); }}>
	<Portal>
		<Dialog.Backdrop class="bg-black/50" />
		<Dialog.Positioner>
			<Dialog.Content class="card {sizeClasses[size]} p-6 shadow-xl">
				<header class="mb-4 flex items-center justify-between">
					<Dialog.Title class="text-xl font-semibold">{title}</Dialog.Title>
					<Dialog.CloseTrigger class="btn-icon hover:bg-surface-200 dark:hover:bg-surface-700" aria-label="Close">
						✕
					</Dialog.CloseTrigger>
				</header>
				{#if children}{@render children()}{/if}
			</Dialog.Content>
		</Dialog.Positioner>
	</Portal>
</Dialog>
