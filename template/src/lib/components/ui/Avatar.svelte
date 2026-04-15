<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		/** URL to the image */
		src?: string | null;
		/** Alt text for the image */
		alt?: string;
		/** Fallback initials when no image (e.g. "JD") */
		fallback?: string;
		/** Size: sm (32px), md (40px), lg (48px), xl (64px) */
		size?: 'sm' | 'md' | 'lg' | 'xl';
		/** Additional classes */
		class?: string;
	}

	let { src, alt = '', fallback = '', size = 'md', class: className = '' }: Props = $props();

	const sizes: Record<string, string> = {
		sm: 'size-8 text-xs',
		md: 'size-10 text-sm',
		lg: 'size-12 text-base',
		xl: 'size-16 text-lg'
	};

	const initials = $derived(
		fallback ||
		(alt
			? alt
					.split(' ')
					.map((w) => w[0])
					.join('')
					.toUpperCase()
					.slice(0, 2)
			: '?')
	);
</script>

<div
	class="relative inline-flex items-center justify-center rounded-full bg-primary-500/10 text-primary-500 font-semibold overflow-hidden {sizes[size]} {className}"
>
	{#if src}
		<img {src} {alt} class="absolute inset-0 w-full h-full object-cover" />
	{:else}
		{initials}
	{/if}
</div>
