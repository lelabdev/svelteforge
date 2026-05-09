<script lang="ts">
	import Card from '$lib/components/ui/Card.svelte';
	import DataTable from '$lib/components/ui/DataTable.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import Input from '$lib/components/ui/form/Input.svelte';
	import TextArea from '$lib/components/ui/form/TextArea.svelte';
	import Select from '$lib/components/ui/form/Select.svelte';
	import Icon from '$lib/components/icons/Icon.svelte';
	import { addToast } from '$lib/components/ui/toast-state.svelte';
	import {
		getAdminNotifications,
		createAdminNotification,
		fetchNotifications
	} from '$lib/stores/notification-store.svelte';

	// Initialize mock data
	fetchNotifications();

	let createOpen = $state(false);

	// Form state
	let formTitle = $state('');
	let formMessage = $state('');
	let formTarget = $state('all');

	// Admin notifications (reactive via getter)
	let adminNotifs = $derived(getAdminNotifications());

	let totalSent = $derived(adminNotifs.length);

	function formatDate(date: Date): string {
		return date.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	function openCreate() {
		formTitle = '';
		formMessage = '';
		formTarget = 'all';
		createOpen = true;
	}

	function handleCreate() {
		if (!formTitle.trim() || !formMessage.trim()) return;

		createAdminNotification({
			title: formTitle.trim(),
			message: formMessage.trim(),
			target: formTarget as 'all' | 'admins' | 'user'
		});

		createOpen = false;
		addToast({
			kind: 'success',
			title: 'Notification sent',
			description: `"${formTitle.trim()}" has been sent to ${formTarget === 'all' ? 'all users' : formTarget === 'admins' ? 'admins only' : 'the selected user'}.`
		});
	}

	const targetOptions = [
		{ value: 'all', label: 'All Users' },
		{ value: 'admins', label: 'Admins Only' },
		{ value: 'user', label: 'Specific User' }
	];
</script>

{#snippet targetCell(row: { target: string; [key: string]: unknown })}
	<Badge variant={row.target === 'all' ? 'primary' : row.target === 'admins' ? 'warning' : 'surface'}>
		{row.target === 'all' ? 'All Users' : row.target === 'admins' ? 'Admins' : 'User'}
	</Badge>
{/snippet}

{#snippet statusCell(row: { status: string; [key: string]: unknown })}
	<Badge variant={row.status === 'read' ? 'success' : 'surface'}>
		{row.status === 'read' ? 'Read' : 'Sent'}
	</Badge>
{/snippet}

{#snippet dateCell(row: { createdAt: Date; [key: string]: unknown })}
	<span class="text-surface-600-400 text-sm">
		{formatDate(row.createdAt)}
	</span>
{/snippet}

<svelte:head>
	<title>Notifications — Admin — SvelteForge</title>
</svelte:head>

<div class="flex flex-col gap-8">
	<!-- Header -->
	<section class="flex flex-col gap-2">
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-3">
				<h1 class="text-3xl font-bold text-surface-50-950">Notifications</h1>
				<span
					class="badge preset-tonal-surface-500"
					style="font-size: var(--text-caption)"
				>
					{totalSent} {totalSent === 1 ? 'notification' : 'notifications'}
				</span>
			</div>
			<Button variant="primary" size="sm" onclick={openCreate}>
				<Icon name="plus" size={16} />
				Create Notification
			</Button>
		</div>
		<p class="text-surface-500">Send and manage in-app notifications for your users.</p>
	</section>

	<!-- Content -->
	{#if adminNotifs.length === 0}
		<Card variant="flat" noPadding>
			<EmptyState
				icon="bell"
				title="No notifications yet"
				description="Create your first notification to send to users."
				action={
					{#snippet}()
						<Button variant="primary" size="sm" onclick={openCreate}>
							<Icon name="plus" size={16} />
							Create Notification
						</Button>
					{/snippet}
				}
			/>
		</Card>
	{:else}
		<Card variant="flat" noPadding>
			<DataTable
				columns={[
					{ key: 'title', label: 'Title', sortable: true },
					{ key: 'target', label: 'Target', cell: targetCell },
					{ key: 'createdAt', label: 'Date', sortable: true, cell: dateCell },
					{ key: 'status', label: 'Status', cell: statusCell }
				]}
				data={adminNotifs as unknown as Record<string, unknown>[]}
				rowKey="id"
				emptyMessage="No notifications sent yet."
			/>
		</Card>
	{/if}
</div>

<!-- Create Modal -->
<Modal open={createOpen} title="Create Notification" onClose={() => (createOpen = false)} size="md">
	{#snippet children()}
		<div class="flex flex-col gap-4">
			<div>
				<label for="notif-title" class="label">
					<span class="label-text">Title</span>
					<span class="text-error-500 ml-1">*</span>
				</label>
				<Input
					id="notif-title"
					name="title"
					placeholder="Notification title"
					bind:value={formTitle}
					required={true}
				/>
			</div>
			<div>
				<label for="notif-message" class="label">
					<span class="label-text">Message</span>
					<span class="text-error-500 ml-1">*</span>
				</label>
				<TextArea
					id="notif-message"
					name="message"
					placeholder="Write your notification message..."
					bind:value={formMessage}
					rows={4}
					required={true}
				/>
			</div>
			<div>
				<Select
					id="notif-target"
					name="target"
					label="Target Audience"
					bind:value={formTarget}
					options={targetOptions}
					required={true}
				/>
			</div>
		</div>
	{/snippet}
	{#snippet footer()}
		<div class="flex items-center justify-end gap-3 px-4 py-3">
			<Button variant="ghost" size="sm" onclick={() => (createOpen = false)}>
				Cancel
			</Button>
			<Button
				variant="primary"
				size="sm"
				onclick={handleCreate}
				disabled={!formTitle.trim() || !formMessage.trim()}
			>
				<Icon name="send" size={16} />
				Send Notification
			</Button>
		</div>
	{/snippet}
</Modal>
