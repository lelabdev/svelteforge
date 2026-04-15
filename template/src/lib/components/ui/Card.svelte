<script lang="ts">
	import { cn } from './utils/cn';
	import type { Snippet } from 'svelte';

	type CardVariant = 'flat' | 'elevated' | 'outlined' | 'none';

	interface Props {
		class?: string;
		variant?: CardVariant;
		padding?: string;
		noPadding?: boolean;
		header?: Snippet;
		children: Snippet;
		footer?: Snippet;
		action?: Snippet; // Header action
		title?: string; // Shorthand for simple header
		icon?: any; // Shorthand icon name
	}

	let {
		class: className = '',
		variant = 'flat',
		padding = 'p-4 sm:p-6',
		noPadding = false,
		header,
		children,
		footer,
		action,
		title,
		icon
	}: Props = $props();

	const variants: Record<CardVariant, string> = {
		flat: 'bg-surface-50-800 border border-surface-200-700',
		elevated:
			'bg-surface-50-800 border border-surface-200-700 shadow-md',
		outlined: 'bg-transparent border border-surface-200-700',
		none: ''
	};

	const cardClass = $derived(cn('card rounded-xl overflow-hidden', variants[variant], className));
</script>

<div class={cardClass}>
	{#if header || title}
		<div
			class="px-4 sm:px-6 py-3 sm:py-4 border-b border-surface-200-700 flex items-center justify-between"
		>
			<div class="flex items-center gap-2">
				{#if header}
					{@render header()}
				{:else if title}
					<h3 class="font-bold text-base sm:text-lg flex items-center gap-2">
						{#if icon}
							<div class="p-1.5 rounded-lg bg-primary-500/10 text-primary-500">
								<!-- Icon component would be better here, but we use Snippet or generic for now -->
								<!-- Assuming Icon component usage elsewhere -->
							</div>
						{/if}
						{title}
					</h3>
				{/if}
			</div>
			{#if action}
				{@render action()}
			{/if}
		</div>
	{/if}

	<div class={noPadding ? '' : padding}>
		{@render children()}
	</div>

	{#if footer}
		<div
			class="px-4 sm:px-6 py-3 sm:py-4 border-t border-surface-300-700 preset-tonal-surface-500"
		>
			{@render footer()}
		</div>
	{/if}
</div>
