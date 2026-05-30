<script lang="ts">
	import { cn } from '$lib/utils/cn';
	import type { HTMLAttributes } from 'svelte/elements';

	interface Props extends HTMLAttributes<HTMLInputElement> {
		label?: string;
		error?: string;
		type?: string;
		placeholder?: string;
		value?: string;
		required?: boolean;
		name?: string;
		class?: string;
	}
	let { label, error, class: className, value = $bindable(''), ...rest }: Props = $props();
	let inputId = $derived(rest.id ?? `input-${Math.random().toString(36).slice(2, 9)}`);
</script>

<div class="w-full">
	{#if label}
		<label class="label" for={inputId}>
			{label}
		</label>
	{/if}
	<input
		id={inputId}
		class={cn('input', error && 'input-error', className)}
		bind:value
		{...rest}
	/>
	{#if error}
		<p class="text-error-500 text-sm mt-1">{error}</p>
	{/if}
</div>
