<script lang="ts">
	import type { PageData } from './$types';
	import DataTable from '$lib/components/ui/DataTable.svelte';
	import SearchInput from '$lib/components/ui/SearchInput.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import Select from '$lib/components/ui/form/Select.svelte';
	import Icon from '$lib/components/icons/Icon.svelte';

	type ActionType =
		| 'user.login'
		| 'user.logout'
		| 'user.create'
		| 'user.update'
		| 'user.delete'
		| 'role.change'
		| 'settings.update'
		| 'notification.send'
		| 'export.data'
		| 'api.key.rotate';

	type ActivityRow = { id: string; timestamp: string; user: string; action: ActionType; details: string; [key: string]: unknown };

	let { data }: { data: PageData } = $props();

	// --- State ---
	let search = $state('');
	let actionFilter = $state('');
	let page = $state(1);
	const perPage = 10;

	let activities = $state<ActivityRow[]>(data.activities as ActivityRow[]);

	// --- Derived ---
	let filtered = $derived(() => {
		let result = [...activities];

		if (actionFilter) {
			result = result.filter((a) => a.action === actionFilter);
		}

		if (search.trim()) {
			const q = search.toLowerCase().trim();
			result = result.filter(
				(a) =>
					a.user.toLowerCase().includes(q) ||
					a.action.toLowerCase().includes(q) ||
					a.details.toLowerCase().includes(q)
			);
		}

		return result;
	});

	let paged = $derived(() => {
		const all = filtered();
		const start = (page - 1) * perPage;
		return all.slice(start, start + perPage);
	});

	let totalPages = $derived(Math.max(1, Math.ceil(filtered().length / perPage)));

	$effect(() => {
		search;
		actionFilter;
		page = 1;
	});

	function formatTimestamp(iso: string): string {
		return new Date(iso).toLocaleString('en-US', {
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
			hour12: true
		});
	}

	function actionLabel(action: ActionType): string {
		const labels: Record<ActionType, string> = {
			'user.login': 'Login',
			'user.logout': 'Logout',
			'user.create': 'User Created',
			'user.update': 'User Updated',
			'user.delete': 'User Deleted',
			'role.change': 'Role Changed',
			'settings.update': 'Settings Updated',
			'notification.send': 'Notification Sent',
			'export.data': 'Data Exported',
			'api.key.rotate': 'API Key Rotated'
		};
		return labels[action] ?? action;
	}

	function actionBadgeVariant(action: ActionType): 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'surface' {
		const variants: Record<ActionType, 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'surface'> = {
			'user.login': 'success',
			'user.logout': 'surface',
			'user.create': 'success',
			'user.update': 'secondary',
			'user.delete': 'error',
			'role.change': 'warning',
			'settings.update': 'secondary',
			'notification.send': 'primary',
			'export.data': 'primary',
			'api.key.rotate': 'warning'
		};
		return variants[action] ?? 'surface';
	}

	const actionOptions = [
		{ value: '', label: 'All Actions' },
		{ value: 'user.login', label: 'Login' },
		{ value: 'user.logout', label: 'Logout' },
		{ value: 'user.create', label: 'User Created' },
		{ value: 'user.update', label: 'User Updated' },
		{ value: 'user.delete', label: 'User Deleted' },
		{ value: 'role.change', label: 'Role Changed' },
		{ value: 'settings.update', label: 'Settings Updated' },
		{ value: 'notification.send', label: 'Notification Sent' },
		{ value: 'export.data', label: 'Data Exported' },
		{ value: 'api.key.rotate', label: 'API Key Rotated' }
	];
</script>

{#snippet timestampCell(row: ActivityRow)}
	<span class="text-surface-600-400 text-sm whitespace-nowrap">
		{formatTimestamp(row.timestamp)}
	</span>
{/snippet}

{#snippet userCell(row: ActivityRow)}
	<span class="font-medium text-surface-50-950">
		{row.user}
	</span>
{/snippet}

{#snippet actionCell(row: ActivityRow)}
	<Badge variant={actionBadgeVariant(row.action)}>
		{actionLabel(row.action)}
	</Badge>
{/snippet}

{#snippet detailsCell(row: ActivityRow)}
	<span class="text-surface-600-400 text-sm">
		{row.details}
	</span>
{/snippet}

<svelte:head>
	<title>Activity Log — Admin — SvelteForge</title>
</svelte:head>

<div class="flex flex-col gap-8">
	<!-- Header -->
	<section class="flex flex-col gap-2">
		<div class="flex items-center gap-3">
			<h1 class="text-3xl font-bold text-surface-50-950">Activity Log</h1>
			<span
				class="badge preset-tonal-surface-500"
				style="font-size: var(--text-caption)"
			>
				{filtered().length} {filtered().length === 1 ? 'entry' : 'entries'}
			</span>
		</div>
		<p class="text-surface-500">Audit trail of all administrative actions and system events.</p>
	</section>

	<!-- Filters Bar -->
	<section class="flex flex-col sm:flex-row gap-3">
		<div class="flex-1">
			<SearchInput bind:value={search} placeholder="Search by user, action, or details..." name="activity-search" />
		</div>
		<div class="w-full sm:w-52">
			<Select
				id="action-filter"
				name="action-filter"
				bind:value={actionFilter}
				options={actionOptions}
			/>
		</div>
	</section>

	<!-- Content -->
	{#if filtered().length === 0}
		<div class="card bg-surface-50-800 border border-surface-200-700" style="border-radius: var(--radius-card)">
			<EmptyState
				icon="clock"
				title="No activity found"
				description="Try adjusting your search or filter criteria."
			/>
		</div>
	{:else}
		<div class="card bg-surface-50-800 border border-surface-200-700 overflow-hidden" style="border-radius: var(--radius-card)">
			<DataTable
				columns={[
					{ key: 'timestamp', label: 'Timestamp', sortable: true, cell: timestampCell },
					{ key: 'user', label: 'User', sortable: true, cell: userCell },
					{ key: 'action', label: 'Action', sortable: true, cell: actionCell },
					{ key: 'details', label: 'Details', cell: detailsCell }
				]}
				data={paged()}
				rowKey="id"
				emptyMessage="No activity matches your filters."
			/>
		</div>

		<!-- Pagination -->
		{#if totalPages > 1}
			<div class="flex items-center justify-between">
				<p class="text-sm text-surface-500">
					Page {page} of {totalPages} — {filtered().length} result{filtered().length !== 1 ? 's' : ''}
				</p>
				<div class="flex items-center gap-2">
					<button
						class="btn preset-outlined-secondary-500"
						disabled={page <= 1}
						onclick={() => (page -= 1)}
					>
						<Icon name="chevronLeft" size={16} />
						Prev
					</button>
					<button
						class="btn preset-outlined-secondary-500"
						disabled={page >= totalPages}
						onclick={() => (page += 1)}
					>
						Next
						<Icon name="chevronRight" size={16} />
					</button>
				</div>
			</div>
		{/if}
	{/if}
</div>
