<script lang="ts">
	import { cn } from '$lib/utils/cn';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	type Variant = 'info' | 'success' | 'warning' | 'error';

	interface Props extends HTMLAttributes<HTMLDivElement> {
		variant?: Variant;
		class?: string;
		children: Snippet;
	}

	let { variant = 'info', class: className = '', children, ...rest }: Props = $props();

	const presets: Record<Variant, string> = {
		info: 'preset-tonal-info',
		success: 'preset-tonal-success',
		warning: 'preset-tonal-warning',
		error: 'preset-tonal-error'
	};

	let classes = $derived(cn('alert', presets[variant], className));
</script>

<div class={classes} {...rest}>
	{@render children()}
</div>
