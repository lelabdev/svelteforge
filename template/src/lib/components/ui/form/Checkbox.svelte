<script lang="ts">
	import { cn } from '../utils/cn';
	import type { Snippet } from 'svelte';

	interface Props {
		id?: string;
		name?: string;
		checked: boolean;
		label?: string;
		children?: Snippet;
		disabled?: boolean;
		required?: boolean;
		class?: string;
		onchange?: (checked: boolean) => void;
	}

	let {
		id,
		name,
		checked = $bindable(false),
		label,
		children,
		disabled = false,
		required = false,
		class: className = '',
		onchange
	}: Props = $props();

	function handleChange(e: Event) {
		const target = e.target as HTMLInputElement;
		checked = target.checked;
		onchange?.(checked);
	}

	const checkboxId = $derived(id || name || 'checkbox');

	const containerClass = $derived(
		cn(
			'flex items-center gap-2 cursor-pointer',
			className,
			disabled && 'opacity-50 cursor-not-allowed'
		)
	);

	const labelClass = $derived(
		cn(
			'text-sm leading-relaxed select-none text-surface-700-300',
			disabled && 'text-surface-500'
		)
	);
</script>

<label class={containerClass}>
	<input
		type="checkbox"
		id={checkboxId}
		{name}
		bind:checked
		{disabled}
		{required}
		onchange={handleChange}
		class="checkbox"
	/>
	{#if children}
		{@render children()}
	{:else if label}
		<span class={labelClass}>
			{label}
			{#if required}
				<span class="text-error-500 ml-1">*</span>
			{/if}
		</span>
	{/if}
</label>
