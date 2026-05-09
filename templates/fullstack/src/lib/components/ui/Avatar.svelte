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

	const sizeStyles: Record<string, string> = {
		sm: 'width: var(--avatar-sm); height: var(--avatar-sm); font-size: var(--text-caption)',
		md: 'width: var(--avatar-md); height: var(--avatar-md); font-size: var(--text-label)',
		lg: 'width: var(--avatar-lg); height: var(--avatar-lg); font-size: var(--text-submit)',
		xl: 'width: var(--avatar-xl); height: var(--avatar-xl); font-size: 1.125rem'
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
	class="relative inline-flex items-center justify-center rounded-full bg-primary-500/10 text-primary-500 overflow-hidden {className}"
	style="{sizeStyles[size]}; font-weight: var(--weight-title)"
>
	{#if src}
		<img {src} {alt} class="absolute inset-0 w-full h-full object-cover" />
	{:else}
		{initials}
	{/if}
</div>
