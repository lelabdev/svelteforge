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
		class?: string;
	}

	let { label, error, class: className, value = $bindable(''), ...rest }: Props = $props();
</script>

<div class="w-full">
	{#if label}
		<label class="label">
			{label}
		</label>
	{/if}
	<input
		class={cn('input', error && 'input-error', className)}
		bind:value
		{...rest}
	/>
	{#if error}
		<p class="text-error-500 text-sm mt-1">{error}</p>
	{/if}
</div>
