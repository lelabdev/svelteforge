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

	type UserRow = { id: string; name: string; email: string; role: 'admin' | 'user'; createdAt: string; [key: string]: unknown };

	let { data }: { data: PageData } = $props();

	// --- State ---
	let search = $state('');
	let roleFilter = $state('');
	let page = $state(1);
	const perPage = 20;

	let confirmOpen = $state(false);
	let confirmAction = $state<'role' | 'delete' | null>(null);
	let selectedUser = $state<UserRow | null>(null);

	let users = $state<UserRow[]>(data.users as UserRow[]);

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

	$effect(() => {
		search;
		roleFilter;
		page = 1;
	});

	function formatDate(iso: string): string {
		return new Date(iso).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	function openConfirm(user: UserRow, action: 'role' | 'delete') {
		selectedUser = user;
		confirmAction = action;
		confirmOpen = true;
	}

	function handleConfirm() {
		if (!selectedUser || !confirmAction) return;

		if (confirmAction === 'role') {
			const newRole = selectedUser.role === 'admin' ? 'user' : 'admin';
			users = users.map((u) =>
				u.id === selectedUser!.id ? { ...u, role: newRole } : u
			);
			addToast({
				kind: 'success',
				title: 'Role updated',
				description: `${selectedUser.name} is now ${newRole === 'admin' ? 'an admin' : 'a user'}.`
			});
		} else if (confirmAction === 'delete') {
			addToast({
				kind: 'info',
				title: 'Feature coming in API integration',
				description: 'User deletion will be available once the API is connected.'
			});
		}

		confirmOpen = false;
		selectedUser = null;
		confirmAction = null;
	}

	function handleCancel() {
		confirmOpen = false;
		selectedUser = null;
		confirmAction = null;
	}

	const roleOptions = [
		{ value: '', label: 'All Roles' },
		{ value: 'admin', label: 'Admin' },
		{ value: 'user', label: 'User' }
	];
</script>

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
	</section>

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
{#if selectedUser}
	<ConfirmDialog
		bind:open={confirmOpen}
		title={confirmAction === 'role' ? 'Change User Role' : 'Delete User'}
		message={confirmAction === 'role'
			? `Are you sure you want to change ${selectedUser.name}'s role from "${selectedUser.role}" to "${selectedUser.role === 'admin' ? 'user' : 'admin'}"?`
			: `Are you sure you want to delete ${selectedUser.name}? This action cannot be undone.`}
		confirmLabel={confirmAction === 'role' ? 'Change Role' : 'Delete'}
		variant={confirmAction === 'delete' ? 'danger' : 'primary'}
		onConfirm={handleConfirm}
		onCancel={handleCancel}
	/>
{/if}
