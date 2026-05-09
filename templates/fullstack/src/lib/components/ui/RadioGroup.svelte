<script lang="ts">
	import { SegmentedControl } from '@skeletonlabs/skeleton-svelte';

	interface RadioOption {
		value: string;
		label: string;
	}

	interface Props {
		options: RadioOption[];
		value?: string;
		name: string;
		label?: string;
		class?: string;
	}

	let {
		options,
		value = $bindable(options[0]?.value ?? ''),
		name,
		label,
		class: className = ''
	}: Props = $props();
</script>

<div class="radio-group {className}">
	<SegmentedControl
		{value}
		name={name}
		onValueChange={(details: { value: string }) => {
			value = details.value;
		}}
	>
		{#if label}
			<SegmentedControl.Label>
				<span class="radio-group-label">{label}</span>
			</SegmentedControl.Label>
		{/if}

		<SegmentedControl.Control>
			<SegmentedControl.Indicator />
			{#each options as option (option.value)}
				<SegmentedControl.Item value={option.value}>
					<SegmentedControl.ItemText>
						<span class="radio-group-text">{option.label}</span>
					</SegmentedControl.ItemText>
					<SegmentedControl.ItemHiddenInput />
				</SegmentedControl.Item>
			{/each}
		</SegmentedControl.Control>
	</SegmentedControl>
</div>

<style>
	.radio-group-label {
		font-size: var(--text-body);
		font-weight: var(--weight-label);
	}

	.radio-group-text {
		font-size: var(--text-body);
	}
</style>
