<script lang="ts">
	import { Tooltip, useTooltip } from '@skeletonlabs/skeleton-svelte';
	import { cn } from './utils/cn';
	import type { Snippet } from 'svelte';

	type TooltipSide = 'top' | 'right' | 'bottom' | 'left';

	interface Props {
		/** The text displayed inside the tooltip */
		content: string;
		/** Preferred placement of the tooltip relative to the trigger */
		side?: TooltipSide;
		/** Delay in milliseconds before the tooltip opens (default 200) */
		delay?: number;
		/** Additional CSS classes applied to the tooltip content panel */
		class?: string;
		/** Snippet rendered as the trigger element */
		children: Snippet;
	}

	let {
		content,
		side = 'top',
		delay = 200,
		class: className = '',
		children
	}: Props = $props();

	const id = `sf-tooltip-${Math.random().toString(36).slice(2, 9)}`;

	const api = useTooltip({
		id,
		positioning: { placement: side },
		openDelay: delay
	});

	const contentClass = $derived(cn('sf-tooltip', className));
</script>

<Tooltip.Provider api={api}>
	<Tooltip.Trigger api={api}>
		{@render children()}
	</Tooltip.Trigger>
	<Tooltip.Positioner api={api}>
		<Tooltip.Content api={api} class={contentClass}>
			{content}
		</Tooltip.Content>
	</Tooltip.Positioner>
</Tooltip.Provider>

<style>
	.sf-tooltip {
		background-color: var(--tooltip-bg);
		color: var(--tooltip-color);
		font-size: var(--tooltip-font-size);
		padding: var(--tooltip-py) var(--tooltip-px);
		border-radius: var(--tooltip-radius);
		line-height: 1.4;
		pointer-events: none;
		max-width: 16rem;
	}
</style>
