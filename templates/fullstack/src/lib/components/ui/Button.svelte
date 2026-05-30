<script lang="ts">
	import { cn } from '$lib/utils/cn';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	type Variant = 'filled' | 'outlined' | 'tonal' | 'ghost' | 'glass' | 'elevated';
	type Color = 'primary' | 'secondary' | 'tertiary' | 'success' | 'warning' | 'error';

	interface Props extends HTMLAttributes<HTMLButtonElement> {
		variant?: Variant;
		color?: Color;
		size?: 'sm' | 'md' | 'lg';
		href?: string;
		type?: 'button' | 'submit' | 'reset';
		disabled?: boolean;
		class?: string;
		children: Snippet;
	}

	let {
		variant = 'filled',
		color = 'primary',
		size = 'md',
		href,
		class: className,
		children,
		...rest
	}: Props = $props();

	const variants: Record<Variant, string> = {
		filled: 'preset-filled',
		outlined: 'preset-outlined',
		tonal: 'preset-tonal',
		ghost: 'preset-ghost',
		glass: 'preset-glass',
		elevated: 'preset-filled shadow-lg'
	};

	const sizes: Record<string, string> = {
		sm: 'px-3 py-1 text-sm',
		md: 'px-4 py-2',
		lg: 'px-6 py-3 text-lg'
	};

	const classes = cn('btn', variants[variant], `variant-${color}`, sizes[size], className);
</script>

{#if href}
	<a {href} class={classes}>
		{@render children()}
	</a>
{:else}
	<button class={classes} {...rest}>
		{@render children()}
	</button>
{/if}
