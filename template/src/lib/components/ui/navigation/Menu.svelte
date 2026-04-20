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
			<SkeletonMenu.Content class="card shadow-lg border border-surface-300-700 z-50" style="padding: var(--menu-panel-p); min-width: var(--menu-min-w)">
				{#each items as item (item.key)}
					<button
						type="button"
						class="w-full flex items-center transition-colors
							{item.disabled
							? 'opacity-50 cursor-not-allowed'
							: item.danger
								? 'text-error-500 hover:bg-error-500/10'
								: 'hover:bg-surface-200-700'
						}"
						style="gap: var(--gap-sm); padding: var(--menu-item-py) var(--menu-item-px); font-size: var(--text-body); border-radius: var(--radius-menu-item)"
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
