<script lang="ts">
	import { type InputType } from './form-shared';
	import { cn } from '../utils/cn';

	interface Props {
		id?: string;
		name?: string;
		type?: InputType;
		value?: string | number | null;
		placeholder?: string;
		required?: boolean;
		disabled?: boolean;
		error?: boolean;
		min?: string | number;
		max?: string | number;
		step?: string | number;
		class?: string;
		onkeydown?: (event: KeyboardEvent) => void;
		onblur?: () => void;
		oninput?: (event: Event) => void;
	}

	let {
		id,
		name,
		type = 'text',
		value = $bindable('' as string | number),
		placeholder = '',
		required = false,
		disabled = false,
		error = false,
		min,
		max,
		step,
		class: className = '',
		onkeydown,
		onblur,
		oninput
	}: Props = $props();

	const normalClass = 'input';

	const errorClass =
		'input border-error-500 text-error-900-100 placeholder:text-error-400-500';

	const inputClass = $derived(cn(error ? errorClass : normalClass, className));
</script>

<input
	{id}
	{name}
	{type}
	bind:value
	{placeholder}
	{required}
	{disabled}
	{min}
	{max}
	{step}
	{onkeydown}
	{onblur}
	{oninput}
	class={inputClass}
/>
