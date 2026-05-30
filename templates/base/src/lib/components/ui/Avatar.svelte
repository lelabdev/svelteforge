<script lang="ts">
	import { cn } from '$lib/utils/cn';

	interface Props {
		src: string;
		alt?: string;
		size?: 'sm' | 'md' | 'lg';
		class?: string;
	}

	let { size = 'md', class: className = '', src, alt = '' }: Props = $props();

	const sizes: Record<string, string> = {
		sm: 'w-8 h-8',
		md: 'w-10 h-10',
		lg: 'w-14 h-14'
	};
</script>

<img
	{src}
	{alt}
	class={cn('rounded-full object-cover ring-2 ring-surface-200-800', sizes[size], className)}
/>
