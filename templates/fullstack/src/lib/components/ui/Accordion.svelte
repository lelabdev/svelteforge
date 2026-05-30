<script lang="ts">
	import { cn } from '$lib/utils/cn';
	import CaretDown from 'phosphor-svelte/lib/CaretDown';

	interface AccordionItem {
		title: string;
		content: string;
	}

	interface Props {
		items: AccordionItem[];
		class?: string;
	}

	let { items, class: className }: Props = $props();
	let openIndex = $state<number | null>(null);

	function toggle(i: number) {
		openIndex = openIndex === i ? null : i;
	}
</script>

<div class={cn('divide-y divide-surface-200 dark:divide-surface-800 rounded-card border border-surface-200 dark:border-surface-800', className)}>
	{#each items as item, i}
		<div>
			<button
				class="w-full flex items-center justify-between p-element hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
				onclick={() => toggle(i)}
			>
				<span class="font-medium">{item.title}</span>
				<CaretDown
					size={18}
					class={cn('transition-transform', openIndex === i && 'rotate-180')}
				/>
			</button>
			{#if openIndex === i}
				<div class="px-element pb-element text-surface-600 dark:text-surface-400">
					{item.content}
				</div>
			{/if}
		</div>
	{/each}
</div>
