<script lang="ts">
	// Test harness: renders Table with a compiled children snippet receiving the
	// TYPED row context — mirrors how consumers write cell renderers (and how
	// the dashboard admin table uses the primitive).
	import Table from '../../packages/svforge/templates/base/src/lib/components/svforge/ui/Table.svelte';

	interface Row {
		id: string;
		name: string;
		role: string;
	}

	let { columns, rows }: { columns: { key: string; label: string }[]; rows: Row[] } = $props();
</script>

<Table {columns} {rows} rowKey="id">
	{#snippet children({ row, col })}
		<strong data-testid="typed-cell">{row.id}:{col.key}</strong>
	{/snippet}
</Table>
