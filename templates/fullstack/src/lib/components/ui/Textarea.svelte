<script lang="ts">
	import { cn } from '$lib/utils/cn';
	import type { HTMLAttributes } from 'svelte/elements';

	interface Props extends HTMLAttributes<HTMLTextAreaElement> {
		label?: string;
		error?: string;
		placeholder?: string;
		rows?: number;
		value?: string;
		class?: string;
	}

	let { label, error, class: className, value = $bindable(''), ...rest }: Props = $props();
	let inputId = $derived(rest.id ?? `textarea-${Math.random().toString(36).slice(2, 9)}`);
</script>

<div class="w-full">
	{#if label}
		<label class="label" for={inputId}>
			{label}
		</label>
	{/if}
	<textarea
		id={inputId}
		class={cn('textarea', error && 'textarea-error', className)}
		bind:value
		{...rest}
	></textarea>
	{#if error}
		<p class="text-error-500 text-sm mt-1">{error}</p>
	{/if}
</div>
