<script lang="ts">
	import { cn } from '../utils/cn';
	import type { Snippet } from 'svelte';
	import Icon from '../../icons/Icon.svelte';

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
		padding = 'card-body',
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

	const cardClass = $derived(cn('card overflow-hidden', variants[variant], className));
</script>

<div class={cardClass} style="border-radius: var(--radius-card)">
	{#if header || title}
		<div
			class="card-header border-b border-surface-200-700 flex items-center justify-between"
		>
			<div class="flex items-center gap-2">
				{#if header}
					{@render header()}
				{:else if title}
					<h3 class="card-title flex items-center">
					{#if icon}
						<div class="card-icon-wrap bg-primary-500/10 text-primary-500">
							<Icon name={icon} size={18} />
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
			class="card-footer border-t border-surface-300-700 preset-tonal-surface-500"
		>
			{@render footer()}
		</div>
	{/if}
</div>

<style>
	.card-body {
		padding: var(--card-p);
	}
	@media (min-width: 640px) {
		.card-body {
			padding: var(--card-p-lg);
		}
	}

	.card-header {
		padding: var(--card-header-py) var(--card-header-px);
	}
	@media (min-width: 640px) {
		.card-header {
			padding: var(--card-header-py-lg) var(--card-header-px-lg);
		}
	}

	.card-footer {
		padding: var(--card-header-py) var(--card-header-px);
	}
	@media (min-width: 640px) {
		.card-footer {
			padding: var(--card-header-py-lg) var(--card-header-px-lg);
		}
	}

	.card-title {
		font-size: var(--text-card-title);
		font-weight: var(--weight-title);
		gap: var(--gap-sm);
	}
	@media (min-width: 640px) {
		.card-title {
			font-size: var(--text-card-title-lg);
		}
	}

	.card-icon-wrap {
		padding: var(--card-icon-p);
		border-radius: var(--radius-icon-wrap);
	}
</style>
