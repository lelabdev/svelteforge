<script lang="ts">
	import type { PageData } from './$types';
	import DataTable from '$lib/components/ui/DataTable.svelte';
	import SearchInput from '$lib/components/ui/SearchInput.svelte';
	import Avatar from '$lib/components/ui/Avatar.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import ConfirmDialog from '$lib/components/ui/ConfirmDialog.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import Select from '$lib/components/ui/form/Select.svelte';
	import Icon from '$lib/components/icons/Icon.svelte';
	import { addToast } from '$lib/components/ui/toast-state.svelte';
	import { exportToCSV, type ExportColumn } from '$lib/utils/export';

	type UserRow = { id: string; name: string; email: string; role: 'admin' | 'user'; createdAt: string; [key: string]: unknown };

	let { data }: { data: PageData } = $props();

	// --- State ---
	let search = $state('');
	let roleFilter = $state('');
	let page = $state(1);
	const perPage = 20;

	let confirmOpen = $state(false);
	let confirmAction = $state<'role' | 'delete' | 'bulkRole' | 'bulkDelete' | null>(null);
	let selectedUser = $state<UserRow | null>(null);

	let users = $state<UserRow[]>(data.users as UserRow[]);

	// --- Bulk selection state ---
	let selectedIds = $state<Set<string>>(new Set());
	let bulkRole = $state<'admin' | 'user'>('user');

	// --- Derived ---
	let filtered = $derived(() => {
		let result = [...users];

		if (roleFilter) {
			result = result.filter((u) => u.role === roleFilter);
		}

		if (search.trim()) {
			const q = search.toLowerCase().trim();
			result = result.filter(
				(u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
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

	let allOnPageSelected = $derived(() => {
		const rows = paged();
		return rows.length > 0 && rows.every((u) => selectedIds.has(u.id));
	});

	let selectedCount = $derived(selectedIds.size);

	$effect(() => {
		search;
		roleFilter;
		page = 1;
	});

	// Clear selections when filters change
	$effect(() => {
		search;
		roleFilter;
		selectedIds = new Set();
	});

	function formatDate(iso: string): string {
		return new Date(iso).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	// --- Selection helpers ---
	function toggleRow(id: string) {
		const next = new Set(selectedIds);
		if (next.has(id)) {
			next.delete(id);
		} else {
			next.add(id);
		}
		selectedIds = next;
	}

	function toggleAllOnPage() {
		const rows = paged();
		if (allOnPageSelected()) {
			// Deselect all on current page
			const next = new Set(selectedIds);
			for (const u of rows) next.delete(u.id);
			selectedIds = next;
		} else {
			// Select all on current page
			const next = new Set(selectedIds);
			for (const u of rows) next.add(u.id);
			selectedIds = next;
		}
	}

	function clearSelection() {
		selectedIds = new Set();
	}

	// --- Single-user confirm ---
	function openConfirm(user: UserRow, action: 'role' | 'delete') {
		selectedUser = user;
		confirmAction = action;
		confirmOpen = true;
	}

	// --- Bulk confirm ---
	function openBulkConfirm(action: 'bulkRole' | 'bulkDelete') {
		confirmAction = action;
		confirmOpen = true;
	}

	function handleConfirm() {
		if (confirmAction === 'role' && selectedUser) {
			const newRole = selectedUser.role === 'admin' ? 'user' : 'admin';
			users = users.map((u) =>
				u.id === selectedUser!.id ? { ...u, role: newRole } : u
			);
			addToast({
				kind: 'success',
				title: 'Role updated',
				description: `${selectedUser.name} is now ${newRole === 'admin' ? 'an admin' : 'a user'}.`
			});
		} else if (confirmAction === 'delete' && selectedUser) {
			addToast({
				kind: 'info',
				title: 'Feature coming in API integration',
				description: 'User deletion will be available once the API is connected.'
			});
		} else if (confirmAction === 'bulkRole') {
			let count = 0;
			users = users.map((u) => {
				if (selectedIds.has(u.id) && u.role !== bulkRole) {
					count++;
					return { ...u, role: bulkRole };
				}
				return u;
			});
			addToast({
				kind: 'success',
				title: 'Bulk role update',
				description: `${count} user${count !== 1 ? 's' : ''} updated to "${bulkRole}".`
			});
		} else if (confirmAction === 'bulkDelete') {
			const count = selectedIds.size;
			addToast({
				kind: 'info',
				title: 'Feature coming in API integration',
				description: `Bulk deletion of ${count} user${count !== 1 ? 's' : ''} will be available once the API is connected.`
			});
		}

		confirmOpen = false;
		selectedUser = null;
		confirmAction = null;
		selectedIds = new Set();
	}

	function handleCancel() {
		confirmOpen = false;
		selectedUser = null;
		confirmAction = null;
	}

	// --- CSV export ---
	const exportColumns: ExportColumn<UserRow>[] = [
		{ key: 'name', label: 'Name' },
		{ key: 'email', label: 'Email' },
		{ key: 'role', label: 'Role' },
		{
			key: 'createdAt',
			label: 'Created',
			format: (_v, row) => formatDate(row.createdAt)
		}
	];

	function handleExportCSV() {
		const dataToExport = selectedCount > 0
			? filtered().filter((u) => selectedIds.has(u.id))
			: filtered();
		if (dataToExport.length === 0) {
			addToast({ kind: 'warning', title: 'No data to export', description: 'Adjust your filters or selection.' });
			return;
		}
		const timestamp = new Date().toISOString().slice(0, 10);
		exportToCSV(dataToExport, `users-export-${timestamp}`, exportColumns);
		addToast({
			kind: 'success',
			title: 'CSV exported',
			description: `Exported ${dataToExport.length} user${dataToExport.length !== 1 ? 's' : ''}.`
		});
	}

	const roleOptions = [
		{ value: '', label: 'All Roles' },
		{ value: 'admin', label: 'Admin' },
		{ value: 'user', label: 'User' }
	];
</script>

{#snippet checkboxHeaderCell()}
	<input
		type="checkbox"
		class="checkbox size-4"
		checked={allOnPageSelected()}
		indeterminate={selectedCount > 0 && !allOnPageSelected()}
		onchange={toggleAllOnPage}
		aria-label="Select all users on this page"
	/>
{/snippet}

{#snippet checkboxCell(row: UserRow)}
	<input
		type="checkbox"
		class="checkbox size-4"
		checked={selectedIds.has(row.id)}
		onchange={() => toggleRow(row.id)}
		aria-label="Select {row.name}"
	/>
{/snippet}

{#snippet avatarCell(row: UserRow)}
	<Avatar alt={row.name} size="sm" />
{/snippet}

{#snippet roleCell(row: UserRow)}
	<Badge variant={row.role === 'admin' ? 'primary' : 'surface'}>
		{row.role === 'admin' ? 'Admin' : 'User'}
	</Badge>
{/snippet}

{#snippet dateCell(row: UserRow)}
	<span class="text-surface-600-400 text-sm">
		{formatDate(row.createdAt)}
	</span>
{/snippet}

{#snippet actionsCell(row: UserRow)}
	<div class="flex items-center justify-end gap-2">
		<button
			class="btn preset-tonal-primary-500 text-xs"
			onclick={() => openConfirm(row, 'role')}
		>
			<Icon name="shield" size={14} />
			Change Role
		</button>
		<button
			class="btn preset-tonal-error-500 text-xs"
			onclick={() => openConfirm(row, 'delete')}
		>
			<Icon name="trash" size={14} />
			Delete
		</button>
	</div>
{/snippet}

<svelte:head>
	<title>User Management — Admin — SvelteForge</title>
</svelte:head>

<div class="flex flex-col gap-8">
	<!-- Header -->
	<section class="flex flex-col gap-2">
		<div class="flex items-center gap-3">
			<h1 class="text-3xl font-bold text-surface-50-950">User Management</h1>
			<span
				class="badge preset-tonal-surface-500"
				style="font-size: var(--text-caption)"
			>
				{filtered().length} {filtered().length === 1 ? 'user' : 'users'}
			</span>
		</div>
		<p class="text-surface-500">Manage your application users, roles, and permissions.</p>
	</section>

	<!-- Filters Bar -->
	<section class="flex flex-col sm:flex-row gap-3">
		<div class="flex-1">
			<SearchInput bind:value={search} placeholder="Search by name or email..." name="user-search" />
		</div>
		<div class="w-full sm:w-48">
			<Select
				id="role-filter"
				name="role-filter"
				bind:value={roleFilter}
				options={roleOptions}
			/>
		</div>
		<button
			class="btn preset-outlined-secondary-500 whitespace-nowrap"
			onclick={handleExportCSV}
		>
			<Icon name="fileText" size={16} />
			Export CSV
		</button>
	</section>

	<!-- Bulk Action Bar -->
	{#if selectedCount > 0}
		<section class="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 rounded-lg bg-surface-100-800 border border-surface-200-700">
			<span class="text-sm text-surface-600-400 font-medium">
				{selectedCount} user{selectedCount !== 1 ? 's' : ''} selected
			</span>
			<div class="flex items-center gap-2 flex-wrap">
				<div class="flex items-center gap-2">
					<select
						class="select-input text-sm py-1"
						bind:value={bulkRole}
						aria-label="Bulk role selection"
					>
						<option value="user">User</option>
						<option value="admin">Admin</option>
					</select>
					<button
						class="btn preset-tonal-primary-500 text-xs"
						onclick={() => openBulkConfirm('bulkRole')}
					>
						<Icon name="shield" size={14} />
						Change Role
					</button>
				</div>
				<button
					class="btn preset-tonal-error-500 text-xs"
					onclick={() => openBulkConfirm('bulkDelete')}
				>
					<Icon name="trash" size={14} />
					Delete
				</button>
				<button
					class="btn preset-outlined-surface-500 text-xs ml-auto"
					onclick={clearSelection}
				>
					<Icon name="x" size={14} />
					Clear
				</button>
			</div>
		</section>
	{/if}

	<!-- Content -->
	{#if filtered().length === 0}
		<div class="card bg-surface-50-800 border border-surface-200-700" style="border-radius: var(--radius-card)">
			<EmptyState
				icon="users"
				title="No users found"
				description="Try adjusting your search or filter criteria."
			/>
		</div>
	{:else}
		<div class="card bg-surface-50-800 border border-surface-200-700 overflow-hidden" style="border-radius: var(--radius-card)">
			<DataTable
				columns={[
					{ key: '_checkbox', label: '', width: 'w-12', cell: checkboxCell, headerCell: checkboxHeaderCell },
					{ key: 'avatar', label: '', width: 'w-12', cell: avatarCell },
					{ key: 'name', label: 'Name', sortable: true },
					{ key: 'email', label: 'Email', sortable: true },
					{ key: 'role', label: 'Role', sortable: true, cell: roleCell },
					{ key: 'createdAt', label: 'Created', sortable: true, cell: dateCell },
					{ key: 'actions', label: 'Actions', align: 'right' as const, cell: actionsCell }
				]}
				data={paged()}
				rowKey="id"
				emptyMessage="No users match your filters."
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

<!-- Confirm Dialog -->
{#if confirmOpen}
	<ConfirmDialog
		bind:open={confirmOpen}
		title={
			confirmAction === 'bulkDelete' ? `Delete ${selectedCount} User${selectedCount !== 1 ? 's' : ''}?`
			: confirmAction === 'bulkRole' ? `Change Role for ${selectedCount} User${selectedCount !== 1 ? 's' : ''}?`
			: confirmAction === 'role' && selectedUser ? 'Change User Role'
			: 'Delete User'
		}
		message={
			confirmAction === 'bulkDelete' ? `Are you sure you want to delete ${selectedCount} user${selectedCount !== 1 ? 's' : ''}? This action cannot be undone.`
			: confirmAction === 'bulkRole' ? `Are you sure you want to change the role to "${bulkRole}" for ${selectedCount} user${selectedCount !== 1 ? 's' : ''}?`
			: confirmAction === 'role' && selectedUser ? `Are you sure you want to change ${selectedUser.name}'s role from "${selectedUser.role}" to "${selectedUser.role === 'admin' ? 'user' : 'admin'}"?`
			: selectedUser ? `Are you sure you want to delete ${selectedUser.name}? This action cannot be undone.`
			: ''
		}
		confirmLabel={
			confirmAction === 'bulkDelete' ? `Delete ${selectedCount} User${selectedCount !== 1 ? 's' : ''}`
			: confirmAction === 'bulkRole' ? 'Change Role'
			: confirmAction === 'role' ? 'Change Role'
			: 'Delete'
		}
		variant={confirmAction === 'delete' || confirmAction === 'bulkDelete' ? 'danger' : 'primary'}
		onConfirm={handleConfirm}
		onCancel={handleCancel}
	/>
{/if}
