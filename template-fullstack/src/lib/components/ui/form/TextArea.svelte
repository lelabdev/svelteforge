<script lang="ts">
	import { cn } from '../utils/cn';

	interface Props {
		id?: string;
		name?: string;
		value?: string;
		placeholder?: string;
		required?: boolean;
		disabled?: boolean;
		error?: boolean;
		rows?: number;
		maxlength?: number;
		class?: string;
	}

	let {
		id,
		name,
		value = $bindable(''),
		placeholder = '',
		required = false,
		disabled = false,
		error = false,
		rows = 3,
		maxlength,
		class: className = ''
	}: Props = $props();

	const normalClass = 'textarea';

	const errorClass =
		'textarea border-error-500 text-error-900-100 placeholder:text-error-400-500';

	const textareaClass = $derived(cn(error ? errorClass : normalClass, className));
</script>

<textarea
	{id}
	{name}
	bind:value
	{placeholder}
	{required}
	{disabled}
	{rows}
	{maxlength}
	class={textareaClass}
></textarea>
