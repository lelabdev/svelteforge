<script lang="ts">
	import { cn } from '../utils/cn';
	import Icon from '$lib/components/icons/Icon.svelte';

	interface Props {
		value?: string;
		placeholder?: string;
		debounce?: number;
		loading?: boolean;
		class?: string;
		name?: string;
	}

	let {
		value = $bindable(''),
		placeholder = 'Search...',
		debounce = 300,
		loading = false,
		class: className = '',
		name = 'search'
	}: Props = $props();

	let inputValue = $state(value);

	// Debounce: local input → parent value
	$effect(() => {
		const current = inputValue;
		const timeout = setTimeout(() => {
			value = current;
		}, debounce);
		return () => clearTimeout(timeout);
	});

	const wrapperClass = $derived(
		cn(
			'relative flex items-center',
			'border border-surface-300-700',
			'bg-surface-50-800',
			'transition-all duration-200',
			'focus-within:ring-2 focus-within:ring-primary-500/50 focus-within:border-primary-500',
			className
		)
	);

	const inputClass = $derived(
		cn(
			'w-full bg-transparent border-0 focus:outline-none',
			'text-surface-900-100',
			'placeholder:text-surface-400-500',
			'disabled:opacity-50 disabled:cursor-not-allowed'
		)
	);
</script>

<div class={wrapperClass} style="border-radius: var(--radius-input-custom)">
	<span class="absolute left-0 flex items-center justify-center pointer-events-none text-surface-400-500" style="padding-left: var(--input-custom-px)">
		<Icon name="search" size={16} />
	</span>

	<input
		{name}
		type="text"
		bind:value={inputValue}
		{placeholder}
		class={inputClass}
		style="padding: var(--input-custom-py) var(--input-custom-px); padding-left: calc(var(--input-custom-px) + 1.25rem); border-radius: var(--radius-input-custom); font-size: var(--text-body)"
	/>

	{#if loading}
		<span class="absolute right-0 flex items-center justify-center text-surface-400-500" style="padding-right: var(--input-custom-px)">
			<Icon name="loader2" size={16} class="animate-spin" />
		</span>
	{/if}
</div>
