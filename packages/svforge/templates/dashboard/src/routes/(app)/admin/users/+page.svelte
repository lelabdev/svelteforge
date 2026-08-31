<script lang="ts">
	import type { PageData } from './$types';
	import { page } from '$app/state';
	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';
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

	/**
	 * Stable server codes → localized feedback (#295). The server never sends
	 * English copy: every visible message is a Paraglide message mapped here.
	 */
	function feedbackFor(code: string | undefined, isError: boolean): string {
		if (!isError) {
			switch (code) {
				case 'created':
					return m.users_created();
				case 'updated':
					return m.users_updated();
				case 'deleted':
					return m.users_deleted();
				case 'verified':
					return m.users_verified_ok();
				case 'unverified':
					return m.users_unverified();
				default:
					return m.users_created();
			}
		}
		switch (code) {
			case 'email_exists':
				return m.users_email_exists();
			case 'email_taken':
				return m.users_email_taken();
			case 'self_delete':
				return m.users_self_delete();
			case 'not_found':
				return m.users_not_found();
			case 'invalid_input':
				return m.users_invalid_input();
			case 'create_failed':
				return m.users_created_failed();
			case 'update_failed':
				return m.users_updated_failed();
			case 'delete_failed':
				return m.users_deleted_failed();
			case 'verify_failed':
				return m.users_verify_failed();
			default:
				return m.users_created_failed();
		}
	}

	/**
	 * Standard SvelteKit use:enhance handler (#295) — the golden reference for
	 * form mutations: `deserialize` + `applyAction` are handled by `enhance`,
	 * the action result is a typed ActionResult (success/failure/redirect/error)
	 * and no imperative fetch parsing exists anywhere.
	 */
	const submitEnhance: SubmitFunction = () => {
		return async ({ result, update }) => {
			if (result.type === 'success') {
				feedback = { type: 'success', message: feedbackFor(result.data?.code, false) };
				closeModal();
				// update() applies the response, resets the form and invalidates the
				// page data (standard applyAction behaviour).
				await update({ reset: true });
			} else if (result.type === 'failure') {
				feedback = { type: 'error', message: feedbackFor(result.data?.code, true) };
			} else if (result.type === 'redirect' || result.type === 'error') {
				// SvelteKit handles redirects and errors natively via applyAction.
				await update();
			}
		};
	};
</script>

<svelte:head>
	<title>{m.users_title()}</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
		<h2 class="text-2xl font-bold">{m.users_heading()}</h2>
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
				<!-- toggleVerify is a real form action too (#295): hidden inputs carry
				     the id and the current state, use:enhance handles the result. -->
				<form method="POST" action="?/toggleVerify" use:enhance={submitEnhance}>
					<input type="hidden" name="id" value={user.id} />
					<input type="hidden" name="verified" value={String(user.emailVerified)} />
					<button type="submit" class="inline-flex" aria-label={user.emailVerified ? m.users_pending() : m.users_verified()}>
						<Badge color={user.emailVerified ? 'success' : 'warning'}>
							{user.emailVerified ? m.users_verified() : m.users_pending()}
						</Badge>
					</button>
				</form>
			{:else if col.key === 'actions'}
				{@const user = asUser(row)}
				<div class="flex items-center justify-end gap-1">
					<button class="btn rounded p-2 preset-tonal-surface" onclick={() => openEdit(user)} aria-label={m.users_edit()}>
						<Pencil size={16} />
					</button>
					<button class="btn rounded p-2 preset-tonal-error" onclick={() => openDelete(user)} disabled={user.id === currentUserId} aria-label={m.users_delete()}>
						<Trash size={16} />
					</button>
				</div>
			{/if}
		{/snippet}
	</Table>

	{#if filtered.length === 0}
		<p class="py-8 text-center text-surface-500">{m.users_none()}</p>
	{/if}
</div>

<!-- Modal overlay -->
{#if modal}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="presentation" onclick={closeModal}>
		<Card class="w-full max-w-md" onclick={(e: Event) => e.stopPropagation()}>
			<div class="mb-4 flex items-center justify-between">
				<h3 class="text-lg font-bold">
					{modal === 'create' ? m.users_modal_create() : modal === 'edit' ? m.users_modal_edit() : m.users_modal_delete()}
				</h3>
				<button class="btn rounded p-1 preset-tonal-surface" onclick={closeModal} aria-label={m.users_close()}>
					<X size={18} />
				</button>
			</div>

			{#if modal === 'create' || modal === 'edit'}
				<!-- Real SvelteKit form action (#295): method=POST + action=?/create|?/update,
				     use:enhance handles deserialize/applyAction. No fetch().json() anywhere. -->
				<form
					method="POST"
					action={modal === 'create' ? '?/create' : '?/update'}
					use:enhance={submitEnhance}
					class="space-y-4"
				>
					{#if modal === 'edit' && editUser}
						<input type="hidden" name="id" value={editUser.id} />
					{/if}
					<Input label={m.users_label_name()} name="name" bind:value={formName} placeholder={m.users_placeholder_name()} required />
					<Input label={m.users_label_email()} name="email" type="email" bind:value={formEmail} placeholder={m.users_placeholder_email()} required />
					{#if modal === 'create'}
						<Input label={m.users_label_password()} name="password" type="password" bind:value={formPassword} placeholder={m.common_min_chars()} required />
					{/if}
					<div class="flex justify-end gap-2 pt-2">
						<Button variant="ghost" type="button" onclick={closeModal}>{m.common_cancel()}</Button>
						<Button type="submit">{modal === 'create' ? m.users_create() : m.common_save()}</Button>
					</div>
				</form>
			{:else if modal === 'delete' && deleteTarget}
				<p class="mb-4 text-surface-500">
					{m.users_delete_confirm({ name: deleteTarget.name })}
				</p>
				<form method="POST" action="?/delete" use:enhance={submitEnhance}>
					<input type="hidden" name="id" value={deleteTarget.id} />
					<div class="flex justify-end gap-2">
						<Button variant="ghost" type="button" onclick={closeModal}>{m.common_cancel()}</Button>
						<Button color="error" type="submit">{m.users_delete_btn()}</Button>
					</div>
				</form>
			{/if}
		</Card>
	</div>
{/if}
