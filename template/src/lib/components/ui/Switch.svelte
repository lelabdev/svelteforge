<script lang="ts">
	import { Switch as SkeletonSwitch } from '@skeletonlabs/skeleton-svelte';

	interface Props {
		/** Whether the switch is checked */
		checked?: boolean;
		/** Label text */
		label?: string;
		/** Small description under the label */
		description?: string;
		/** Disabled state */
		disabled?: boolean;
		/** Change handler */
		onCheckedChange?: (checked: boolean) => void;
		/** Additional classes for the wrapper */
		class?: string;
	}

	let {
		checked = false,
		label,
		description,
		disabled = false,
		onCheckedChange,
		class: className = ''
	}: Props = $props();
</script>

<div class="flex items-center justify-between gap-4 {className}">
	{#if label}
		<div class="flex-1">
			<span class="text-sm font-medium">{label}</span>
			{#if description}
				<p class="text-xs text-muted-foreground mt-0.5">{description}</p>
			{/if}
		</div>
	{/if}

	<SkeletonSwitch
		{checked}
		{disabled}
		aria-label={label}
		onCheckedChange={(e: { checked: boolean }) => onCheckedChange?.(e.checked)}
	>
		<SkeletonSwitch.Control>
			<SkeletonSwitch.Thumb />
		</SkeletonSwitch.Control>
	</SkeletonSwitch>
</div>
