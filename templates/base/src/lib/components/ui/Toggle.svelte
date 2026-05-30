<script lang="ts">
	import { cn } from '$lib/utils/cn';

	interface Props {
		label?: string;
		checked?: boolean;
		class?: string;
	}

	let { label, class: className, checked = $bindable(false) }: Props = $props();
</script>

<label class={cn('flex items-center gap-2 cursor-pointer', className)}>
	<input type="checkbox" class="toggle" bind:checked />
	{#if label}
		<span>{label}</span>
	{/if}
</label>
