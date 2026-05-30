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

	let { variant = 'info', class: className, children, ...rest }: Props = $props();

	const variants: Record<Variant, string> = {
		info: 'alert-info',
		success: 'alert-success',
		warning: 'alert-warning',
		error: 'alert-error'
	};
</script>

<div class={cn('alert', variants[variant], className)} {...rest}>
	{@render children()}
</div>
