<script lang="ts">
	import { cn } from '../utils/cn';

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
		<span class="label-text flex justify-between items-center gap-4">
			<span>
				{label}
				{#if hint}
					<span class="opacity-70">{hint}</span>
				{/if}
			</span>
			{#if error}
				<span class="text-xs text-error-500 font-medium shrink-0">{error}</span>
			{/if}
		</span>
		<input
			{id}
			{type}
			{name}
			bind:value
			{placeholder}
			{required}
			{disabled}
			{onblur}
			{oninput}
			class="input {error ? 'border-error-500' : ''}"
		/>
	</label>
</div>
