<script lang="ts">
	import { Progress } from '@skeletonlabs/skeleton-svelte';
	import { cn } from './utils/cn';

	type ProgressSize = 'sm' | 'md' | 'lg';

	interface Props {
		/** Current progress value (0 to max) */
		value: number;
		/** Maximum value (default 100) */
		max?: number;
		/** Accessible label read by screen readers */
		label?: string;
		/** Height variant of the progress bar */
		size?: ProgressSize;
		/** Additional CSS classes applied to the root wrapper */
		class?: string;
	}

	let { value, max = 100, label, size = 'md', class: className = '' }: Props = $props();

	const sizeMap: Record<ProgressSize, string> = {
		sm: 'sf-progress-sm',
		md: 'sf-progress-md',
		lg: 'sf-progress-lg'
	};

	const rootClass = $derived(cn('sf-progress', sizeMap[size], className));

	const percentage = $derived(Math.min(Math.max((value / max) * 100, 0), 100));
</script>

<div class={rootClass}>
	{#if label}
		<span class="sf-progress-label">{label}</span>
	{/if}

	<Progress.Root {value} {max} aria-label={label ?? 'Progress'}>
		<Progress.Track class="sf-progress-track">
			<Progress.Range class="sf-progress-range" />
		</Progress.Track>
	</Progress.Root>

	<span class="sf-progress-value" aria-hidden="true">{Math.round(percentage)}%</span>
</div>

<style>
	.sf-progress {
		display: flex;
		align-items: center;
		gap: var(--gap-sm);
	}

	.sf-progress-label {
		font-size: var(--text-caption);
		font-weight: var(--weight-label);
		color: var(--color-surface-600-400);
		white-space: nowrap;
	}

	.sf-progress-track {
		flex: 1;
		border-radius: 9999px;
		overflow: hidden;
		background-color: var(--color-surface-200-800);
	}

	.sf-progress-sm .sf-progress-track {
		height: var(--progress-sm);
	}

	.sf-progress-md .sf-progress-track {
		height: var(--progress-md);
	}

	.sf-progress-lg .sf-progress-track {
		height: var(--progress-lg);
	}

	.sf-progress-range {
		height: 100%;
		border-radius: 9999px;
		background-color: var(--color-primary-500);
		transition: width 0.3s ease;
	}

	.sf-progress-value {
		font-size: var(--text-caption);
		font-weight: var(--weight-label);
		color: var(--color-surface-600-400);
		min-width: 2.5rem;
		text-align: right;
		tabular-nums: true;
	}
</style>
