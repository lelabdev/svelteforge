<script lang="ts">
	import type { PageData } from './$types';
	import { invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import * as m from '$lib/paraglide/messages.js';
	import { Card, AvatarInitial, Feedback, Table } from '$lib/components/svforge/ui';
	import { Badge } from '$lib/components/svforge/primitives';
	import { Button, Input } from '$lib/components/svforge/primitives';
	import type { UserRow } from '$lib/types';
	import UserPlus from 'phosphor-svelte/lib/UserPlus';
	import Trash from 'phosphor-svelte/lib/Trash';
	import Pencil from 'phosphor-svelte/lib/Pencil';
	import X from 'phosphor-svelte/lib/X';

	let { data }: { data: PageData } = $props();
	let currentUserId = $derived(page.data.user?.id);

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

	// Table slot receives rows as Record<string, unknown> — recover the row type.
	function asUser(row: Record<string, unknown>): UserRow {
		return row as unknown as UserRow;
	}

	// Columns are re-derived so Paraglide labels stay reactive to the locale.
	let columns = $derived([
		{ key: 'name', label: m.users_name() },
		{ key: 'email', label: m.users_email(), class: 'hidden sm:table-cell' },
		{ key: 'status', label: m.users_status() },
		{ key: 'actions', label: m.users_actions(), class: 'text-right' }
	]);

	let filtered = $derived(
		data.users.filter((u) =>
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

	function openEdit(u: { id: string; name: string; email: string }) {
		editUser = { id: u.id, name: u.name, email: u.email };
		formName = u.name;
		formEmail = u.email;
		modal = 'edit';
	}

	function openDelete(u: { id: string; name: string }) {
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
			feedback = { type: 'success', message: result.data?.message || m.users_created() };
			closeModal();
			invalidate();
		} else {
			feedback = { type: 'error', message: result.data?.message || m.users_created_failed() };
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
			feedback = { type: 'success', message: result.data?.message || m.users_updated() };
			closeModal();
			invalidate();
		} else {
			feedback = { type: 'error', message: result.data?.message || m.users_updated_failed() };
		}
	}

	async function submitDelete() {
		if (!deleteTarget) return;
		const formData = new FormData();
		formData.set('id', deleteTarget.id);

		const res = await fetch('?/delete', { method: 'POST', body: formData });
		const result = await res.json();
		if (result.type === 'success') {
			feedback = { type: 'success', message: result.data?.message || m.users_deleted() };
			closeModal();
			invalidate();
		} else {
			feedback = { type: 'error', message: result.data?.message || m.users_deleted_failed() };
		}
	}

	async function toggleVerify(u: { id: string; emailVerified: boolean }) {
		const formData = new FormData();
		formData.set('id', u.id);
		formData.set('verified', String(u.emailVerified));

		const res = await fetch('?/toggleVerify', { method: 'POST', body: formData });
		const result = await res.json();
		if (result.type === 'success') {
			feedback = { type: 'success', message: result.data?.message || m.users_verified_ok() };
			invalidate();
		} else {
			feedback = { type: 'error', message: result.data?.message || m.users_verify_failed() };
		}
	}

	async function invalidate() {
		await invalidateAll();
	}
</script>

<svelte:head>
	<title>{m.users_title()}</title>
</svelte:head>

<div class="space-y-group">
	<div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
		<h2 class="text-2xl font-heading font-bold">{m.users_heading()}</h2>
		<Button onclick={openCreate}>
			<UserPlus size={16} class="mr-1" />
			{m.users_add()}
		</Button>
	</div>

	{#if feedback}
		<Feedback type={feedback.type} message={feedback.message} ondismiss={() => (feedback = null)} />
	{/if}

	<Input placeholder={m.users_search_placeholder()} bind:value={search} />

	<!-- CRUD data table: SvelteForge Table primitive (golden reference) -->
	<Table {columns} rows={filtered}>
		{#snippet children({ row, col })}
			{#if col.key === 'name'}
				{@const user = asUser(row)}
				<div class="flex items-center gap-3">
					<AvatarInitial name={user.name} size="sm" />
					<div>
						<p class="font-medium">{user.name}</p>
						<p class="text-xs text-surface-500 sm:hidden">{user.email}</p>
					</div>
				</div>
			{:else if col.key === 'status'}
				{@const user = asUser(row)}
				<button onclick={() => toggleVerify(user)} aria-label={user.emailVerified ? m.users_pending() : m.users_verified()}>
					<Badge color={user.emailVerified ? 'success' : 'warning'}>
						{user.emailVerified ? m.users_verified() : m.users_pending()}
					</Badge>
				</button>
			{:else if col.key === 'actions'}
				{@const user = asUser(row)}
				<div class="flex items-center justify-end gap-1">
					<button class="btn preset-tonal-surface p-2 rounded" onclick={() => openEdit(user)} aria-label={m.users_edit()}>
						<Pencil size={16} />
					</button>
					<button class="btn preset-tonal-error p-2 rounded" onclick={() => openDelete(user)} disabled={user.id === currentUserId} aria-label={m.users_delete()}>
						<Trash size={16} />
					</button>
				</div>
			{/if}
		{/snippet}
	</Table>

	{#if filtered.length === 0}
		<p class="text-center text-surface-500 py-section">{m.users_none()}</p>
	{/if}
</div>

<!-- Modal overlay -->
{#if modal}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-element" role="presentation" onclick={closeModal}>
		<Card class="w-full max-w-modal" onclick={(e: Event) => e.stopPropagation()}>
			<div class="flex items-center justify-between mb-4">
				<h3 class="text-lg font-heading font-bold">
					{modal === 'create' ? m.users_modal_create() : modal === 'edit' ? m.users_modal_edit() : m.users_modal_delete()}
				</h3>
				<button class="btn preset-tonal-surface p-1 rounded" onclick={closeModal} aria-label={m.users_close()}>
					<X size={18} />
				</button>
			</div>

			{#if modal === 'create' || modal === 'edit'}
				<form class="space-y-4" onsubmit={(e) => { e.preventDefault(); modal === 'create' ? submitCreate() : submitEdit(); }}>
					<Input label={m.users_label_name()} bind:value={formName} placeholder={m.users_placeholder_name()} required />
					<Input label={m.users_label_email()} type="email" bind:value={formEmail} placeholder={m.users_placeholder_email()} required />
					{#if modal === 'create'}
						<Input label={m.users_label_password()} type="password" bind:value={formPassword} placeholder={m.common_min_chars()} required />
					{/if}
					<div class="flex justify-end gap-2 pt-2">
						<Button variant="ghost" onclick={closeModal}>{m.common_cancel()}</Button>
						<Button type="submit">{modal === 'create' ? m.users_create() : m.common_save()}</Button>
					</div>
				</form>
			{:else if modal === 'delete' && deleteTarget}
				<p class="text-surface-500 mb-4">
					{m.users_delete_confirm({ name: deleteTarget.name })}
				</p>
				<div class="flex justify-end gap-2">
					<Button variant="ghost" onclick={closeModal}>{m.common_cancel()}</Button>
					<Button color="error" onclick={submitDelete}>{m.users_delete_btn()}</Button>
				</div>
			{/if}
		</Card>
	</div>
{/if}
