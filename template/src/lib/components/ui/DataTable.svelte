<script lang="ts" generics="T extends Record<string, unknown>">
	import type { Snippet } from 'svelte';

	interface Column {
		/** Column key (property name in data) */
		key: string;
		/** Display header */
		label: string;
		/** Optional custom cell renderer */
		cell?: Snippet<[T]>;
		/** Header alignment */
		align?: 'left' | 'center' | 'right';
		/** Column width class */
		width?: string;
		/** Sortable */
		sortable?: boolean;
	}

	interface Props {
		/** Column definitions */
		columns: Column[];
		/** Row data */
		data: T[];
		/** Unique key property in data */
		rowKey?: string;
		/** Loading state */
		loading?: boolean;
		/** Empty state message */
		emptyMessage?: string;
		/** Called when a row is clicked */
		onRowClick?: (row: T) => void;
		/** Additional classes */
		class?: string;
	}

	let {
		columns,
		data,
		rowKey = 'id',
		loading = false,
		emptyMessage = 'No data found',
		onRowClick,
		class: className = ''
	}: Props = $props();

	let sortKey = $state('');
	let sortDir = $state<'asc' | 'desc'>('asc');

	function handleSort(key: string) {
		if (sortKey === key) {
			sortDir = sortDir === 'asc' ? 'desc' : 'asc';
		} else {
			sortKey = key;
			sortDir = 'asc';
		}
	}

	const sortedData = $derived(() => {
		if (!sortKey) return data;
		const sorted = [...data].sort((a, b) => {
			const av = a[sortKey];
			const bv = b[sortKey];
			if (av == null || bv == null) return 0;
			const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true });
			return sortDir === 'asc' ? cmp : -cmp;
		});
		return sorted;
	});
</script>

<div class="overflow-x-auto {className}">
	<table class="w-full" style="font-size: var(--text-body)">
		<thead>
			<tr class="border-b border-surface-300-700">
				{#each columns as col (col.key)}
					<th
						class="text-left text-muted-foreground uppercase tracking-wider {col.width ?? ''}"
						style="padding: var(--table-cell-py) var(--table-cell-px); font-size: var(--text-caption); font-weight: var(--weight-subtitle)"
					>
						{#if col.sortable}
							<button
								type="button"
								class="inline-flex items-center hover:text-surface-900-100 transition-colors"
								style="gap: var(--gap-xs)"
								onclick={() => handleSort(col.key)}
							>
								{col.label}
								{#if sortKey === col.key}
									<span class="text-primary-500">{sortDir === 'asc' ? '↑' : '↓'}</span>
								{/if}
							</button>
						{:else}
							{col.label}
						{/if}
					</th>
				{/each}
			</tr>
		</thead>

		<tbody>
			{#if loading}
				{#each columns as _}
					<tr class="border-b border-surface-200-800">
						<td style="padding: var(--table-cell-py) var(--table-cell-px)">
							<div class="h-4 bg-surface-200-700 rounded animate-pulse"></div>
						</td>
					</tr>
				{/each}
			{:else if data.length === 0}
				<tr>
					<td colspan={columns.length} class="text-center text-muted-foreground" style="padding: var(--table-empty-py) var(--table-cell-px)">
						{emptyMessage}
					</td>
				</tr>
			{:else}
				{#each sortedData() as row (String(row[rowKey] ?? ''))}
					<tr
						class="border-b border-surface-200-800
							{onRowClick ? 'hover:bg-surface-100-800 cursor-pointer' : ''}"
						onclick={() => onRowClick?.(row)}
						onkeydown={(e) => { if (e.key === 'Enter') onRowClick?.(row); }}
						role={onRowClick ? 'button' : undefined}
						tabindex={onRowClick ? 0 : undefined}
					>
						{#each columns as col (col.key)}
							<td style="padding: var(--table-cell-py) var(--table-cell-px)">
								{#if col.cell}
									{@render col.cell(row)}
								{:else}
									{row[col.key] ?? '—'}
								{/if}
							</td>
						{/each}
					</tr>
				{/each}
			{/if}
		</tbody>
	</table>
</div>
