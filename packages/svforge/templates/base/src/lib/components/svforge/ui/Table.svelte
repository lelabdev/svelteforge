<script lang="ts">
	import { cn } from '$lib/utils/cn';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	interface Column {
		key: string;
		label: string;
		class?: string;
	}

	interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
		columns: Column[];
		rows: Record<string, unknown>[];
		class?: string;
		/** Optional per-cell renderer for rich cells (avatar, badge, actions…). */
		children?: Snippet<[{ row: Record<string, unknown>; col: Column }]>;
	}

	let { columns, rows, class: className = '', children, ...rest }: Props = $props();
</script>

<div class={cn('overflow-x-auto rounded-container border border-surface-200-800', className)} {...rest}>
	<table class="w-full">
		<thead class="bg-surface-100-800">
			<tr>
				{#each columns as col}
					<th class="px-4 py-3 text-left text-sm font-semibold text-surface-500 {col.class}">
						{col.label}
					</th>
				{/each}
			</tr>
		</thead>
		<tbody class="divide-y divide-surface-200-800">
			{#each rows as row}
				<tr class="transition-colors hover:bg-surface-50-900">
					{#each columns as col}
						<td class="px-4 py-3 text-sm {col.class}">
							{#if children}
								{@render children({ row, col })}
							{:else}
								{String(row[col.key] ?? '')}
							{/if}
						</td>
					{/each}
				</tr>
			{/each}
		</tbody>
	</table>
</div>
