<script lang="ts">
	import { Popover, Portal } from '@skeletonlabs/skeleton-svelte';
	import type { Snippet } from 'svelte';

	interface Props {
		side?: 'top' | 'right' | 'bottom' | 'left';
		class?: string;
		children: Snippet;
		content: Snippet;
	}

	let {
		side = 'bottom',
		class: className = '',
		children,
		content
	}: Props = $props();
</script>

<Popover positioning={{ placement: side }}>
	<Popover.Trigger>
		{@render children()}
	</Popover.Trigger>

	<Portal>
		<Popover.Positioner>
			<Popover.Content class="popover-content card shadow-lg border border-surface-300-700 {className}">
				{@render content()}
			</Popover.Content>
		</Popover.Positioner>
	</Portal>
</Popover>

<style>
	.popover-content {
		padding: var(--card-p);
		border-radius: var(--radius-card);
		z-index: 50;
	}
</style>
