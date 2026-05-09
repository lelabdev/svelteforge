<script lang="ts">
	import { cn } from './utils/cn';

	interface Props {
		count: number;
		max?: number;
		size?: 'sm' | 'md';
		class?: string;
	}

	let {
		count,
		max = 99,
		size = 'sm',
		class: className = ''
	}: Props = $props();

	const displayText = $derived(count > max ? `${max}+` : `${count}`);

	const sizeClasses = {
		sm: 'min-w-4 h-4 text-[10px]',
		md: 'min-w-5 h-5 text-xs'
	};
</script>

<span
	class={cn(
		'absolute -top-1 -right-1 bg-error-500 text-surface-50 rounded-full flex items-center justify-center font-semibold leading-none select-none',
		sizeClasses[size],
		className
	)}
	aria-label="{count} notification{count !== 1 ? 's' : ''}"
>
	{displayText}
</span>
