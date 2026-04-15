<script lang="ts">
	import { Dialog, Portal } from '@skeletonlabs/skeleton-svelte';
	import type { Snippet } from 'svelte';

	interface Props {
		open: boolean;
		title: string;
		onClose: () => void;
		size?: 'sm' | 'md' | 'lg' | 'xl';
		header?: Snippet;
		children: Snippet;
		footer?: Snippet;
	}

	let { open, title, onClose, size = 'md', header, children, footer }: Props = $props();

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
			<Dialog.Content class="card {sizeClasses[size]} shadow-xl overflow-hidden">
				<div class="px-6 py-4 border-b border-surface-300-700 flex items-center justify-between">
					<Dialog.Title class="font-bold text-lg">{title}</Dialog.Title>
					<Dialog.CloseTrigger class="btn-icon hover:bg-surface-200-700" aria-label="Close">
						✕
					</Dialog.CloseTrigger>
				</div>

				<div class="p-6">
					{@render children()}
				</div>

				{#if footer}
					<div class="px-6 py-4 border-t border-surface-300-700">
						{@render footer()}
					</div>
				{/if}
			</Dialog.Content>
		</Dialog.Positioner>
	</Portal>
</Dialog>
