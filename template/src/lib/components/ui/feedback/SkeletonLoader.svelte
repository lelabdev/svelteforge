<script lang="ts">
	import { cn } from '../utils/cn';

	type Variant = 'text' | 'circular' | 'rectangular';

	interface Props {
		variant?: Variant;
		width?: string;
		height?: string;
		lines?: number;
		class?: string;
	}

	let {
		variant = 'text',
		width,
		height,
		lines = 3,
		class: className = ''
	}: Props = $props();

	const defaultHeights: Record<Variant, string> = {
		text: '1rem',
		circular: '3rem',
		rectangular: '6rem'
	};

	const resolvedWidth = $derived(width ?? (variant === 'circular' ? '3rem' : '100%'));
	const resolvedHeight = $derived(height ?? defaultHeights[variant]);
</script>

{#if variant === 'text'}
	<div class={cn('flex flex-col', className)} style="gap: var(--gap-sm)">
		{#each Array(lines) as _, i}
			<div
				class="animate-pulse bg-surface-200-700 rounded"
				style="width: {i === lines - 1 ? '75%' : resolvedWidth}; height: var(--text-body)"
			></div>
		{/each}
	</div>
{:else if variant === 'circular'}
	<div
		class={cn('animate-pulse bg-surface-200-700 rounded-full shrink-0', className)}
		style="width: {resolvedWidth}; height: {resolvedHeight}"
	></div>
{:else}
	<div
		class={cn('animate-pulse bg-surface-200-700', className)}
		style="width: {resolvedWidth}; height: {resolvedHeight}; border-radius: var(--radius-card)"
	></div>
{/if}
