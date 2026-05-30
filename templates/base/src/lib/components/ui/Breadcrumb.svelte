<script lang="ts">
	import { cn } from '$lib/utils/cn';
	import CaretRight from 'phosphor-svelte/lib/CaretRight';

	interface Crumb {
		href?: string;
		label: string;
	}

	interface Props {
		items: Crumb[];
		class?: string;
	}

	let { items, class: className }: Props = $props();
</script>

<nav aria-label="Breadcrumb" class={className}>
	<ol class="flex items-center gap-1 text-sm">
		{#each items as item, i}
			<li class="flex items-center gap-1">
				{#if i > 0}
					<CaretRight size={14} class="text-surface-400" />
				{/if}
				{#if item.href}
					<a href={item.href} class="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
						{item.label}
					</a>
				{:else}
					<span class="text-surface-500">{item.label}</span>
				{/if}
			</li>
		{/each}
	</ol>
</nav>
