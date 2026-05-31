<script lang="ts">
	import { cn } from '$lib/utils/cn';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	type Variant = 'filled' | 'outlined' | 'tonal' | 'ghost';
	type Color = 'primary' | 'secondary' | 'tertiary' | 'success' | 'warning' | 'error' | 'surface';
	type Size = 'sm' | 'md' | 'lg';

	interface Props extends HTMLAttributes<HTMLButtonElement> {
		variant?: Variant;
		color?: Color;
		size?: Size;
		href?: string;
		loading?: boolean;
		disabled?: boolean;
		type?: 'button' | 'submit' | 'reset';
		class?: string;
		children: Snippet;
	}

	let {
		variant = 'filled',
		color = 'primary',
		size = 'md',
		href,
		loading = false,
		disabled = false,
		type = 'button',
		class: className = '',
		children,
		...rest
	}: Props = $props();

	const presets = {
		filled: {
			primary: 'preset-filled-primary-400-600',
			secondary: 'preset-filled-secondary-400-600',
			tertiary: 'preset-filled-tertiary-400-600',
			success: 'preset-filled-success-400-600',
			warning: 'preset-filled-warning-400-600',
			error: 'preset-filled-error-400-600',
			surface: 'preset-filled-surface-400-600'
		},
		outlined: {
			primary: 'preset-outlined-primary-400-600',
			secondary: 'preset-outlined-secondary-400-600',
			tertiary: 'preset-outlined-tertiary-400-600',
			success: 'preset-outlined-success-400-600',
			warning: 'preset-outlined-warning-400-600',
			error: 'preset-outlined-error-400-600',
			surface: 'preset-outlined-surface-400-600'
		},
		tonal: {
			primary: 'preset-tonal-primary',
			secondary: 'preset-tonal-secondary',
			tertiary: 'preset-tonal-tertiary',
			success: 'preset-tonal-success',
			warning: 'preset-tonal-warning',
			error: 'preset-tonal-error',
			surface: 'preset-tonal-surface'
		},
		ghost: {
			primary: 'hover:preset-tonal-primary',
			secondary: 'hover:preset-tonal-secondary',
			tertiary: 'hover:preset-tonal-tertiary',
			success: 'hover:preset-tonal-success',
			warning: 'hover:preset-tonal-warning',
			error: 'hover:preset-tonal-error',
			surface: 'hover:preset-tonal-surface'
		}
	} as const;

	let sizeClass = $derived(
		size === 'sm' ? 'btn-sm' : size === 'lg' ? 'btn-lg' : 'btn-md'
	);

	let presetClass = $derived(
		presets[variant]?.[color] ?? ''
	);

	let classes = $derived(cn('btn', presetClass, sizeClass, className));
</script>

{#if href}
	<a {href} class={classes}>
		{#if loading}
			<span
				class="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
			></span>
		{/if}
		{@render children()}
	</a>
{:else}
	<button class={classes} disabled={disabled || loading} type={type} {...rest} aria-busy={loading}>
		{#if loading}
			<span
				class="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
			></span>
		{/if}
		{@render children()}
	</button>
{/if}
