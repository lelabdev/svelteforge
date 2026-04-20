<script lang="ts">
	import Button from '../input/Button.svelte';
	import { cn } from '../utils/cn';

	interface Props {
		/** Loading state - shows spinner and loadingText */
		loading?: boolean;
		/** Button text when not loading */
		text: string;
		/** Button text when loading (default: 'Loading...') */
		loadingText?: string;
		/** Additional disabled state (combined with loading) */
		disabled?: boolean;
		/** Button variant (default: 'primary') */
		variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'glass' | 'cta' | 'tonal';
		/** Button size (default: 'md') */
		size?: 'sm' | 'md' | 'lg';
		/** Additional CSS classes */
		class?: string;
	}

	let {
		loading = false,
		text,
		loadingText = 'Loading...',
		disabled = false,
		variant = 'primary',
		size = 'md',
		class: className
	}: Props = $props();
</script>

<Button
	type="submit"
	disabled={disabled || loading}
	{variant}
	{size}
	class={cn(
		'w-full hover:scale-[1.02] active:scale-[0.98] transition-transform',
		className
	)}
	style="padding-top: var(--submit-py); padding-bottom: var(--submit-py); font-size: var(--text-submit); font-weight: var(--weight-label)"
>
	{#if loading}
		{loadingText}
	{:else}
		{text}
	{/if}
</Button>
