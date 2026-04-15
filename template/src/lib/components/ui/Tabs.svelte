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
		pills: 'bg-surface-100-800'
	};

	const variantStyles: Record<string, string> = {
		underline: '',
		pills: 'border-radius: var(--radius-tab-pills); padding: var(--tab-pills-p)'
	};
</script>

{#if tabs.length > 0}
	<SkeletonTabs {value} onValueChange={(e: { value: string }) => { value = e.value; onValueChange?.(e.value); }}>
		<div class="{variantClasses[variant]} {className}" style="{variantStyles[variant]}">
			<SkeletonTabs.List class="flex" style="gap: var(--gap-xs)">
				{#each tabs as tab (tab.value)}
					<SkeletonTabs.Trigger value={tab.value} disabled={tab.disabled}>
						<div class="flex items-center" style="gap: var(--gap-sm); padding: var(--tab-trigger-py) var(--tab-trigger-px); font-size: var(--text-body); font-weight: var(--weight-subtitle)">
							{#if tab.icon}{@render tab.icon()}{/if}
							{tab.label}
						</div>
					</SkeletonTabs.Trigger>
				{/each}
			</SkeletonTabs.List>

			{#each tabs as tab (tab.value)}
				<SkeletonTabs.Content value={tab.value}>
					<div style="padding-top: var(--space-inline)">
						{@render tab.content()}
					</div>
				</SkeletonTabs.Content>
			{/each}
		</div>
	</SkeletonTabs>
{/if}
