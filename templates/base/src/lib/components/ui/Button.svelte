<script lang="ts">
	import { cn } from '$lib/utils/cn';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	type Variant = 'filled' | 'outlined' | 'tonal' | 'ghost' | 'glass' | 'elevated' | 'gradient';
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
		},
		glass: {
			primary: 'preset-glass-primary',
			secondary: 'preset-glass-secondary',
			tertiary: 'preset-glass-tertiary',
			success: 'preset-glass-success',
			warning: 'preset-glass-warning',
			error: 'preset-glass-error',
			surface: 'preset-glass-surface'
		},
		elevated: {
			primary: 'preset-filled-primary-100-900 shadow-xl',
			secondary: 'preset-filled-secondary-100-900 shadow-xl',
			tertiary: 'preset-filled-tertiary-100-900 shadow-xl',
			success: 'preset-filled-success-100-900 shadow-xl',
			warning: 'preset-filled-warning-100-900 shadow-xl',
			error: 'preset-filled-error-100-900 shadow-xl',
			surface: 'preset-filled-surface-100-900 shadow-xl'
		},
		gradient: {
			primary: 'preset-gradient-primary',
			secondary: 'preset-gradient-secondary',
			tertiary: 'preset-gradient-tertiary',
			success: 'preset-gradient-success',
			warning: 'preset-gradient-warning',
			error: 'preset-gradient-error',
			surface: 'preset-gradient-surface'
		}
	} as const;

	let sizeClass = $derived(
		size === 'sm' ? 'btn-sm' : size === 'lg' ? 'btn-lg' : 'btn-md'
	);

	let presetClass = $derived(presets[variant][color]);

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

<style>
	/* Custom gradient presets */
	.preset-gradient-primary {
		background-image: linear-gradient(-45deg, var(--color-primary-300), var(--color-primary-700));
		color: var(--color-primary-contrast-500);
	}
	.preset-gradient-secondary {
		background-image: linear-gradient(
			-45deg,
			var(--color-secondary-300),
			var(--color-secondary-700)
		);
		color: var(--color-secondary-contrast-500);
	}
	.preset-gradient-tertiary {
		background-image: linear-gradient(-45deg, var(--color-tertiary-300), var(--color-tertiary-700));
		color: var(--color-tertiary-contrast-500);
	}
	.preset-gradient-success {
		background-image: linear-gradient(-45deg, var(--color-success-300), var(--color-success-700));
		color: var(--color-success-contrast-500);
	}
	.preset-gradient-warning {
		background-image: linear-gradient(-45deg, var(--color-warning-300), var(--color-warning-700));
		color: var(--color-warning-contrast-500);
	}
	.preset-gradient-error {
		background-image: linear-gradient(-45deg, var(--color-error-300), var(--color-error-700));
		color: var(--color-error-contrast-500);
	}
	.preset-gradient-surface {
		background-image: linear-gradient(-45deg, var(--color-surface-300), var(--color-surface-700));
		color: var(--color-surface-contrast-500);
	}

	/* Custom glass presets */
	.preset-glass-primary {
		background: color-mix(in oklab, var(--color-primary-500) 40%, transparent);
		box-shadow: 0 0px 30px color-mix(in oklab, var(--color-primary-500) 50%, transparent) inset;
		backdrop-filter: blur(16px);
	}
	.preset-glass-secondary {
		background: color-mix(in oklab, var(--color-secondary-500) 40%, transparent);
		box-shadow: 0 0px 30px color-mix(in oklab, var(--color-secondary-500) 50%, transparent) inset;
		backdrop-filter: blur(16px);
	}
	.preset-glass-tertiary {
		background: color-mix(in oklab, var(--color-tertiary-500) 40%, transparent);
		box-shadow: 0 0px 30px color-mix(in oklab, var(--color-tertiary-500) 50%, transparent) inset;
		backdrop-filter: blur(16px);
	}
	.preset-glass-success {
		background: color-mix(in oklab, var(--color-success-500) 40%, transparent);
		box-shadow: 0 0px 30px color-mix(in oklab, var(--color-success-500) 50%, transparent) inset;
		backdrop-filter: blur(16px);
	}
	.preset-glass-warning {
		background: color-mix(in oklab, var(--color-warning-500) 40%, transparent);
		box-shadow: 0 0px 30px color-mix(in oklab, var(--color-warning-500) 50%, transparent) inset;
		backdrop-filter: blur(16px);
	}
	.preset-glass-error {
		background: color-mix(in oklab, var(--color-error-500) 40%, transparent);
		box-shadow: 0 0px 30px color-mix(in oklab, var(--color-error-500) 50%, transparent) inset;
		backdrop-filter: blur(16px);
	}
	.preset-glass-surface {
		background: color-mix(in oklab, var(--color-surface-500) 40%, transparent);
		box-shadow: 0 0px 30px color-mix(in oklab, var(--color-surface-500) 50%, transparent) inset;
		backdrop-filter: blur(16px);
	}
</style>
