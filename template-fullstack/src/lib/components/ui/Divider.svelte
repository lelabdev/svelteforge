<script lang="ts">
	import { cn } from './utils/cn';

	type DividerOrientation = 'horizontal' | 'vertical';

	interface Props {
		/** Direction of the divider line */
		orientation?: DividerOrientation;
		/** Optional text label displayed in the center of the divider (e.g. "OR") */
		label?: string;
		/** Additional CSS classes applied to the root element */
		class?: string;
	}

	let { orientation = 'horizontal', label, class: className = '' }: Props = $props();

	const isHorizontal = $derived(orientation === 'horizontal');

	const rootClass = $derived(
		cn(
			'sf-divider',
			isHorizontal ? 'sf-divider-horizontal' : 'sf-divider-vertical',
			label ? 'sf-divider-with-label' : '',
			className
		)
	);
</script>

<div
	class={rootClass}
	role="separator"
	aria-orientation={orientation}
>
	{#if label}
		<span class="sf-divider-line" />
		<span class="sf-divider-label">{label}</span>
		<span class="sf-divider-line" />
	{:else}
		<span class="sf-divider-line" />
	{/if}
</div>

<style>
	/* ── Horizontal ── */

	.sf-divider-horizontal {
		display: flex;
		align-items: center;
		gap: var(--gap-md);
		padding: var(--divider-spacing) 0;
	}

	.sf-divider-horizontal .sf-divider-line {
		flex: 1;
		height: 1px;
		background-color: var(--divider-color);
	}

	/* ── Vertical ── */

	.sf-divider-vertical {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--gap-md);
		padding: 0 var(--divider-spacing);
		align-self: stretch;
	}

	.sf-divider-vertical .sf-divider-line {
		flex: 1;
		width: 1px;
		background-color: var(--divider-color);
	}

	/* ── Label ── */

	.sf-divider-label {
		font-size: var(--text-caption);
		font-weight: var(--weight-label);
		color: var(--color-surface-500);
		white-space: nowrap;
		line-height: 1;
	}
</style>
