<script lang="ts">
	import { enhance } from '$app/forms';
	import { Card, Input, Button, AvatarInitial, Feedback } from '$lib/components/svforge/ui';
	import Lock from 'phosphor-svelte/lib/Lock';
	import type { ActionData } from './$types';

	let { data, form }: { data: any, form: ActionData } = $props();
	let currentPassword = $state('');
	let newPassword = $state('');
	let confirmPassword = $state('');

	// Client-side validation
	let validationError = $state('');

	$effect(() => {
		if (form?.message) validationError = '';
	});
</script>

<svelte:head>
	<title>Settings — SvelteForge Admin</title>
</svelte:head>

<div class="space-y-section max-w-2xl">
	<h2 class="text-2xl font-heading font-bold">Settings</h2>

	<!-- Profile info -->
	<Card>
		{#snippet header()}
			<h3 class="font-heading font-bold">Profile</h3>
		{/snippet}
		<div class="space-y-3">
			<div class="flex items-center gap-4">
				<AvatarInitial name={data.user.name} size="lg" />
				<div>
					<p class="font-medium">{data.user.name}</p>
					<p class="text-sm text-surface-500">{data.user.email}</p>
				</div>
			</div>
		</div>
	</Card>

	<!-- Change password -->
	<Card>
		{#snippet header()}
			<div class="flex items-center gap-2">
				<Lock size={18} />
				<h3 class="font-heading font-bold">Change Password</h3>
			</div>
		{/snippet}

		{#if form?.message}
			<Feedback type={form.success ? 'success' : 'error'} message={form.message} class="mb-4" />
		{/if}
		{#if validationError}
			<div class="mb-4 p-3 rounded-card text-sm bg-error-100 dark:bg-error-900 text-error-700 dark:text-error-300">
				{validationError}
			</div>
		{/if}

		<form method="POST" action="?/changePassword" onsubmit={(e) => {
				if (newPassword !== confirmPassword) {
					e.preventDefault();
					validationError = 'Passwords do not match';
				} else {
					validationError = '';
				}
			}} use:enhance class="space-y-4">
			<Input label="Current Password" type="password" name="currentPassword" bind:value={currentPassword} required />
			<Input label="New Password" type="password" name="newPassword" bind:value={newPassword} placeholder="Min 8 characters" required />
			<Input label="Confirm New Password" type="password" name="confirmPassword" bind:value={confirmPassword} required />
			<div class="flex justify-end">
				<Button type="submit">Update Password</Button>
			</div>
		</form>
	</Card>
</div>
