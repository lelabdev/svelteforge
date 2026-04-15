<script lang="ts">
	import { Menu as SkeletonMenu, Portal } from '@skeletonlabs/skeleton-svelte';
	import type { Snippet } from 'svelte';

	interface MenuItem {
		/** Unique key */
		key: string;
		/** Display label */
		label: string;
		/** Optional icon snippet */
		icon?: Snippet;
		/** Disabled */
		disabled?: boolean;
		/** Danger style */
		danger?: boolean;
	}

	interface Props {
		/** Trigger element */
		trigger: Snippet;
		/** Menu items */
		items: MenuItem[];
		/** Called when an item is selected */
		onSelect: (key: string) => void;
		/** Alignment */
		align?: 'start' | 'end';
		/** Additional classes for the trigger wrapper */
		class?: string;
	}

	let { trigger, items, onSelect, align = 'start', class: className = '' }: Props = $props();
</script>

<SkeletonMenu>
	<SkeletonMenu.Trigger>
		{@render trigger()}
	</SkeletonMenu.Trigger>

	<Portal>
		<SkeletonMenu.Positioner>
			<SkeletonMenu.Content class="card p-1 min-w-[180px] shadow-lg border border-surface-300 dark:border-surface-700 z-50">
				{#each items as item (item.key)}
					<button
						type="button"
						class="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors
							{item.disabled
							? 'opacity-50 cursor-not-allowed'
							: item.danger
								? 'text-error-500 hover:bg-error-500/10'
								: 'hover:bg-surface-200 dark:hover:bg-surface-700'
						}"
						disabled={item.disabled}
						onclick={() => { if (!item.disabled) onSelect(item.key); }}
					>
						{#if item.icon}
							<span class="shrink-0">{@render item.icon()}</span>
						{/if}
						{item.label}
					</button>
				{/each}
			</SkeletonMenu.Content>
		</SkeletonMenu.Positioner>
	</Portal>
</SkeletonMenu>
