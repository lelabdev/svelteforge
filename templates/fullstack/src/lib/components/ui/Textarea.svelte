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
</script>

<div class="w-full">
	{#if label}
		<label class="label">
			{label}
		</label>
	{/if}
	<textarea
		class={cn('textarea', error && 'textarea-error', className)}
		bind:value
		{...rest}
	></textarea>
	{#if error}
		<p class="text-error-500 text-sm mt-1">{error}</p>
	{/if}
</div>
