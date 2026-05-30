<script lang="ts">
	import { cn } from '$lib/utils/cn';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	type Variant = 'flat' | 'elevated' | 'outlined';

	interface Props extends HTMLAttributes<HTMLDivElement> {
		variant?: Variant;
		class?: string;
		children: Snippet;
		header?: Snippet;
		footer?: Snippet;
	}

	let { variant = 'flat', class: className = '', children, header, footer, ...rest }: Props = $props();

	const variantClasses: Record<Variant, string> = {
		flat: 'card',
		elevated: 'card shadow-lg',
		outlined: 'card ring-1 ring-surface-200-800'
	};

	let classes = $derived(cn(variantClasses[variant], 'p-element rounded-card', className));
</script>

<div class={classes} {...rest}>
	{#if header}
		<div class="border-b border-surface-200-800 pb-3 mb-3">
			{@render header()}
		</div>
	{/if}

	{@render children()}

	{#if footer}
		<div class="border-t border-surface-200-800 pt-3 mt-3">
			{@render footer()}
		</div>
	{/if}
</div>
