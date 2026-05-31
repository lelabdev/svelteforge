<script lang="ts">
	import { cn } from '$lib/utils/cn';
	import type { HTMLAttributes } from 'svelte/elements';

	interface Props extends HTMLAttributes<HTMLInputElement> {
		label?: string;
		checked?: boolean;
		class?: string;
	}

	let { label, class: className, checked = $bindable(false), ...rest }: Props = $props();
</script>

<label class={cn('flex items-center gap-2 cursor-pointer', className)}>
	<input type="checkbox" class="checkbox" bind:checked {...rest} />
	{#if label}
		<span>{label}</span>
	{/if}
</label>
