<script lang="ts">
	import { cn } from '../utils/cn';

	interface SelectOption {
		value: string;
		label: string;
		disabled?: boolean;
	}

	interface Props {
		id: string;
		name?: string;
		value: string;
		label?: string;
		options: SelectOption[];
		placeholder?: string;
		required?: boolean;
		disabled?: boolean;
		error?: string;
		class?: string;
	}

	let {
		id,
		name,
		value = $bindable(''),
		label,
		options,
		placeholder,
		required = false,
		disabled = false,
		error = '',
		class: className = ''
	}: Props = $props();

	const containerClass = $derived(cn('space-y-1', className));

	const selectClass = $derived(
		cn(
			'select-input',
			error && 'border-error-500 focus:ring-error-500/50 focus:border-error-500'
		)
	);

	const labelClass = $derived(cn('label', error && 'text-error-500'));
</script>

<div class={containerClass}>
	{#if label}
		<label for={id} class={labelClass}>
			<span class="label-text">{label}</span>
			{#if required}
				<span class="text-error-500 ml-1">*</span>
			{/if}
		</label>
	{/if}
	<select {id} {name} bind:value {required} {disabled} class={selectClass}>
		{#if placeholder}
			<option value="">{placeholder}</option>
		{/if}
		{#each options as option}
			<option value={option.value} disabled={option.disabled}>
				{option.label}
			</option>
		{/each}
	</select>
	{#if error}
		<p class="text-error-500" style="font-size: var(--text-label)">{error}</p>
	{/if}
</div>
