<script lang="ts">
	import { cn } from '$lib/utils/cn';
	import type { HTMLAttributes } from 'svelte/elements';

	interface Column {
		key: string;
		label: string;
		class?: string;
	}

	interface Props extends HTMLAttributes<HTMLDivElement> {
		columns: Column[];
		rows: Record<string, string>[];
		class?: string;
	}

	let { columns, rows, class: className, ...rest }: Props = $props();
</script>

<div class={cn('overflow-x-auto rounded-card border border-surface-200 dark:border-surface-800', className)} {...rest}>
	<table class="w-full">
		<thead class="bg-surface-100 dark:bg-surface-800">
			<tr>
				{#each columns as col}
					<th class="px-element py-3 text-left text-sm font-semibold text-surface-600 dark:text-surface-400 {col.class}">
						{col.label}
					</th>
				{/each}
			</tr>
		</thead>
		<tbody class="divide-y divide-surface-200 dark:divide-surface-800">
			{#each rows as row}
				<tr class="hover:bg-surface-50 dark:hover:bg-surface-900 transition-colors">
					{#each columns as col}
						<td class="px-element py-3 text-sm {col.class}">
							{row[col.key]}
						</td>
					{/each}
				</tr>
			{/each}
		</tbody>
	</table>
</div>
