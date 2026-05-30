<script lang="ts">
	import { cn } from '$lib/utils/cn';

	interface Tab {
		label: string;
		content: string;
	}

	interface Props {
		tabs: Tab[];
		class?: string;
	}

	let { tabs, class: className }: Props = $props();
	let activeTab = $state(0);
</script>

<div class={className}>
	<div class="flex border-b border-surface-200 dark:border-surface-800 gap-1">
		{#each tabs as tab, i}
			<button
				class={cn(
					'px-4 py-2 font-medium transition-colors rounded-t-card',
					activeTab === i
						? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-500'
						: 'text-surface-500 hover:text-surface-900 dark:hover:text-surface-100'
				)}
				onclick={() => (activeTab = i)}
			>
				{tab.label}
			</button>
		{/each}
	</div>
	<div class="p-element">
		{tabs[activeTab].content}
	</div>
</div>
