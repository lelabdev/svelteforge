<script lang="ts">
	import { cn } from '$lib/utils/cn';
	import type { HTMLAttributes } from 'svelte/elements';

	interface Props extends HTMLAttributes<HTMLSelectElement> {
		label?: string;
		error?: string;
		options: { value: string; label: string }[];
		value?: string;
		class?: string;
	}

	let { label, error, options, class: className, value = $bindable(''), ...rest }: Props = $props();
</script>

<div class="w-full">
	{#if label}
		<label class="label" for={rest.id}>
			{label}
		</label>
	{/if}
	<select class={cn('select', error && 'select-error', className)} bind:value {...rest}>
		{#each options as opt}
			<option value={opt.value}>{opt.label}</option>
		{/each}
	</select>
	{#if error}
		<p class="text-error-500 text-sm mt-1">{error}</p>
	{/if}
</div>
