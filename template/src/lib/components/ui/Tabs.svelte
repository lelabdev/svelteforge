<script lang="ts">
	import { Tabs as SkeletonTabs } from '@skeletonlabs/skeleton-svelte';
	import type { Snippet } from 'svelte';

	interface TabItem {
		value: string;
		label: string;
		icon?: Snippet;
		content: Snippet;
		disabled?: boolean;
	}

	interface Props {
		tabs: TabItem[];
		value?: string;
		onValueChange?: (value: string) => void;
		variant?: 'underline' | 'pills';
		class?: string;
	}

	let {
		tabs,
		value = $bindable(tabs[0]?.value ?? ''),
		onValueChange,
		variant = 'underline',
		class: className = ''
	}: Props = $props();

	const variantClasses: Record<string, string> = {
		underline: '',
		pills: 'bg-surface-100 dark:bg-surface-800 rounded-lg p-1'
	};
</script>

{#if tabs.length > 0}
	<SkeletonTabs {value} onValueChange={(e: { value: string }) => { value = e.value; onValueChange?.(e.value); }}>
		<div class="{variantClasses[variant]} {className}">
			<SkeletonTabs.List class="flex gap-1">
				{#each tabs as tab (tab.value)}
					<SkeletonTabs.Trigger value={tab.value} disabled={tab.disabled}>
						<div class="flex items-center gap-2 px-3 py-2 text-sm font-medium">
							{#if tab.icon}{@render tab.icon()}{/if}
							{tab.label}
						</div>
					</SkeletonTabs.Trigger>
				{/each}
			</SkeletonTabs.List>

			{#each tabs as tab (tab.value)}
				<SkeletonTabs.Content value={tab.value}>
					<div class="pt-4">
						{@render tab.content()}
					</div>
				</SkeletonTabs.Content>
			{/each}
		</div>
	</SkeletonTabs>
{/if}
