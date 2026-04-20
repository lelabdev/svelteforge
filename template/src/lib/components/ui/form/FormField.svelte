<script lang="ts">
	import { cn } from '../utils/cn';
	import Input from './Input.svelte';

	type InputType = 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';

	interface Props {
		label: string;
		id: string;
		type?: InputType;
		value?: string | undefined;
		placeholder?: string;
		required?: boolean;
		disabled?: boolean;
		hint?: string;
		error?: string;
		class?: string;
		name?: string;
		onblur?: () => void;
		oninput?: (event: Event) => void;
	}

	let {
		label,
		id,
		type = 'text',
		value = $bindable('' as string | undefined),
		placeholder = '',
		required = false,
		disabled = false,
		hint,
		error = '',
		class: className = '',
		name,
		onblur,
		oninput
	}: Props = $props();
</script>

<div class={className}>
	<label for={id} class="label">
		<span class="label-text flex justify-between items-center" style="gap: var(--gap-lg)">
			<span>
				{label}
				{#if hint}
					<span class="opacity-70">{hint}</span>
				{/if}
			</span>
			{#if error}
				<span class="text-error-500 shrink-0" style="font-size: var(--text-caption); font-weight: var(--weight-label)">{error}</span>
			{/if}
		</span>
		<Input
			{id}
			{type}
			{name}
			bind:value
			{placeholder}
			{required}
			{disabled}
			error={!!error}
			{onblur}
			{oninput}
		/>
	</label>
</div>
