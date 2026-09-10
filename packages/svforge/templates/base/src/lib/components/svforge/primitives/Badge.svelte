<script lang="ts">
	import { cn } from '$lib/utils/cn';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	type Variant = 'filled' | 'outlined' | 'tonal';
	type Color = 'primary' | 'secondary' | 'tertiary' | 'success' | 'warning' | 'error' | 'surface';

	interface Props extends HTMLAttributes<HTMLSpanElement> {
		variant?: Variant;
		color?: Color;
		class?: string;
		children: Snippet;
	}

	let {
		variant = 'filled',
		color = 'primary',
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

	// #317: Skeleton v5 ships NO badge size utilities (only badge, badge-dot,
	// badge-icon) — the `badge` utility owns sizing through --badge-size. The
	// former size prop emitted invented per-size classes (dead in v5,
	// rejected by svforge check); a smaller/larger badge is a theme change
	// (--badge-size), not a local override.
	let presetClass = $derived(presets[variant][color]);

	let classes = $derived(cn('badge', presetClass, className));
</script>

<span class={classes} {...rest}>
	{@render children()}
</span>
