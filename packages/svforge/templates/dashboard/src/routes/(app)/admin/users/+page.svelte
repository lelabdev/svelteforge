<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { page } from '$app/stores';
	import { Button, Badge, Input, Card, AvatarInitial, Feedback } from '$lib/components/svforge/ui';
	import UserPlus from 'phosphor-svelte/lib/UserPlus';
	import Trash from 'phosphor-svelte/lib/Trash';
	import Pencil from 'phosphor-svelte/lib/Pencil';
	import X from 'phosphor-svelte/lib/X';

	let { data } = $props();
	let currentUserId = $derived($page.data.user?.id);

	let search = $state('');
	let feedback = $state<{ type: 'success' | 'error'; message: string } | null>(null);

	// Modal state
	let modal = $state<'create' | 'edit' | 'delete' | null>(null);
	let editUser = $state<{ id: string; name: string; email: string } | null>(null);
	let deleteTarget = $state<{ id: string; name: string } | null>(null);

	// Form fields
	let formName = $state('');
	let formEmail = $state('');
	let formPassword = $state('');

	let filtered = $derived(
		data.users.filter((u: any) =>
			u.name.toLowerCase().includes(search.toLowerCase()) ||
			u.email.toLowerCase().includes(search.toLowerCase())
		)
	);

	function openCreate() {
		formName = '';
		formEmail = '';
		formPassword = '';
		modal = 'create';
	}

	function openEdit(u: any) {
		editUser = { id: u.id, name: u.name, email: u.email };
		formName = u.name;
		formEmail = u.email;
		modal = 'edit';
	}

	function openDelete(u: any) {
		deleteTarget = { id: u.id, name: u.name };
		modal = 'delete';
	}

	function closeModal() {
		modal = null;
		editUser = null;
		deleteTarget = null;
	}

	async function submitCreate() {
		const formData = new FormData();
		formData.set('name', formName);
		formData.set('email', formEmail);
		formData.set('password', formPassword);

		const res = await fetch('?/create', { method: 'POST', body: formData });
		const result = await res.json();
		if (result.type === 'success') {
			feedback = { type: 'success', message: result.message || 'User created' };
			closeModal();
			invalidate();
		} else {
			feedback = { type: 'error', message: result.message || 'Failed to create user' };
		}
	}

	async function submitEdit() {
		if (!editUser) return;
		const formData = new FormData();
		formData.set('id', editUser.id);
		formData.set('name', formName);
		formData.set('email', formEmail);

		const res = await fetch('?/update', { method: 'POST', body: formData });
		const result = await res.json();
		if (result.type === 'success') {
			feedback = { type: 'success', message: result.message || 'User updated' };
			closeModal();
			invalidate();
		} else {
			feedback = { type: 'error', message: result.message || 'Failed to update user' };
		}
	}

	async function submitDelete() {
		if (!deleteTarget) return;
		const formData = new FormData();
		formData.set('id', deleteTarget.id);

		const res = await fetch('?/delete', { method: 'POST', body: formData });
		const result = await res.json();
		if (result.type === 'success') {
			feedback = { type: 'success', message: result.message || 'User deleted' };
			closeModal();
			invalidate();
		} else {
			feedback = { type: 'error', message: result.message || 'Failed to delete user' };
		}
	}

	async function toggleVerify(u: any) {
		const formData = new FormData();
		formData.set('id', u.id);
		formData.set('verified', String(u.emailVerified));

		const res = await fetch('?/toggleVerify', { method: 'POST', body: formData });
		const result = await res.json();
		if (result.type === 'success') {
			feedback = { type: 'success', message: result.message };
			invalidate();
		}
	}

	async function invalidate() {
		await invalidateAll();
	}
</script>

<svelte:head>
	<title>Users — SvelteForge Admin</title>
</svelte:head>

<div class="space-y-group">
	<div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
		<h2 class="text-2xl font-heading font-bold">Users</h2>
		<Button onclick={openCreate}>
			<UserPlus size={16} class="mr-1" />
			Add User
		</Button>
	</div>

	{#if feedback}
		<Feedback type={feedback.type} message={feedback.message} ondismiss={() => (feedback = null)} />
	{/if}

	<Input placeholder="Search users..." bind:value={search} />

	<!-- Users table -->
	<div class="overflow-x-auto rounded-card border border-surface-200-800">
		<table class="w-full text-sm">
			<thead class="bg-surface-100-900">
				<tr>
					<th class="text-left px-4 py-3 font-medium">Name</th>
					<th class="text-left px-4 py-3 font-medium hidden sm:table-cell">Email</th>
					<th class="text-left px-4 py-3 font-medium">Status</th>
					<th class="text-right px-4 py-3 font-medium">Actions</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-surface-100-800">
				{#each filtered as u}
					<tr class="hover:hover:bg-surface-900-50 transition-colors">
						<td class="px-4 py-3">
							<div class="flex items-center gap-3">
								<AvatarInitial name={u.name} size="sm" />
								<div>
									<p class="font-medium">{u.name}</p>
									<p class="text-xs text-surface-500 sm:hidden">{u.email}</p>
								</div>
							</div>
						</td>
						<td class="px-4 py-3 hidden sm:table-cell text-surface-500">{u.email}</td>
						<td class="px-4 py-3">
							<button onclick={() => toggleVerify(u)}>
								<Badge color={u.emailVerified ? 'success' : 'warning'}>
									{u.emailVerified ? '✅ Verified' : '⏳ Pending'}
								</Badge>
							</button>
						</td>
						<td class="px-4 py-3">
							<div class="flex items-center justify-end gap-1">
								<button class="btn preset-ghost variant-surface p-2 rounded" onclick={() => openEdit(u)} aria-label="Edit user">
									<Pencil size={16} />
								</button>
								<button class="btn preset-ghost variant-error p-2 rounded" onclick={() => openDelete(u)} disabled={u.id === currentUserId} aria-label="Delete user">
									<Trash size={16} />
								</button>
							</div>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

	{#if filtered.length === 0}
		<p class="text-center text-surface-500 py-section">No users found</p>
	{/if}
</div>

<!-- Modal overlay -->
{#if modal}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-element" onclick={closeModal}>
		<Card class="w-full max-w-modal" onclick={(e: Event) => e.stopPropagation()}>
			<div class="flex items-center justify-between mb-4">
				<h3 class="text-lg font-heading font-bold">
					{modal === 'create' ? 'Add User' : modal === 'edit' ? 'Edit User' : 'Delete User'}
				</h3>
				<button class="btn preset-ghost variant-surface p-1 rounded" onclick={closeModal} aria-label="Close">
					<X size={18} />
				</button>
			</div>

			{#if modal === 'create' || modal === 'edit'}
				<form class="space-y-4" onsubmit={(e) => { e.preventDefault(); modal === 'create' ? submitCreate() : submitEdit(); }}>
					<Input label="Name" bind:value={formName} placeholder="John Doe" required />
					<Input label="Email" type="email" bind:value={formEmail} placeholder="john@example.com" required />
					{#if modal === 'create'}
						<Input label="Password" type="password" bind:value={formPassword} placeholder="Min 8 characters" required />
					{/if}
					<div class="flex justify-end gap-2 pt-2">
						<Button variant="ghost" onclick={closeModal}>Cancel</Button>
						<Button type="submit">{modal === 'create' ? 'Create' : 'Save'}</Button>
					</div>
				</form>
			{:else if modal === 'delete' && deleteTarget}
				<p class="text-surface-500 mb-4">
					Are you sure you want to delete <strong>{deleteTarget.name}</strong>? This action cannot be undone.
				</p>
				<div class="flex justify-end gap-2">
					<Button variant="ghost" onclick={closeModal}>Cancel</Button>
					<Button color="error" onclick={submitDelete}>Delete</Button>
				</div>
			{/if}
		</Card>
	</div>
{/if}
