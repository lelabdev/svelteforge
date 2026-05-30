<script lang="ts">
	import { cn } from '$lib/utils/cn';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	type Variant = 'filled' | 'outlined' | 'tonal';
	type Color = 'primary' | 'secondary' | 'tertiary' | 'success' | 'warning' | 'error' | 'surface';
	type Size = 'sm' | 'md' | 'lg';

	interface Props extends HTMLAttributes<HTMLSpanElement> {
		variant?: Variant;
		color?: Color;
		size?: Size;
		class?: string;
		children: Snippet;
	}

	let {
		variant = 'filled',
		color = 'primary',
		size = 'md',
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
		}
	} as const;

	let sizeClass = $derived(
		size === 'sm' ? 'badge-sm' : size === 'lg' ? 'badge-lg' : 'badge-md'
	);

	let presetClass = $derived(presets[variant][color]);

	let classes = $derived(cn('badge', presetClass, sizeClass, className));
</script>

<span class={classes} {...rest}>
	{@render children()}
</span>
