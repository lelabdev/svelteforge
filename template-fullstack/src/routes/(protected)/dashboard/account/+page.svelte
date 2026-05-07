<script lang="ts">
	import type { PageData } from './$types';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { accountSchema, changePasswordSchema } from '$lib/schemas';
	import {
		Tabs,
		Card,
		Button,
		FormField,
		PasswordInput,
		addToast
	} from '$lib/components';

	let { data }: { data: PageData } = $props();

	// Profile form
	const {
		form: profileForm,
		errors: profileErrors,
		enhance: profileEnhance,
		submitting: profileSubmitting
	} = superForm(data.profileForm, {
		validators: zod4Client(accountSchema),
		dataType: 'json',
		invalidateAll: false,
		TTL: 0,
		onResult({ result }) {
			if (result.type === 'success') {
				addToast({ kind: 'success', title: 'Profile updated', description: 'Your profile has been saved.' });
			}
		}
	});

	// Password form
	const {
		form: passwordForm,
		errors: passwordErrors,
		enhance: passwordEnhance,
		submitting: passwordSubmitting
	} = superForm(data.passwordForm, {
		validators: zod4Client(changePasswordSchema),
		dataType: 'json',
		invalidateAll: false,
		TTL: 0,
		onResult({ result }) {
			if (result.type === 'success') {
				addToast({ kind: 'success', title: 'Password changed', description: 'Your password has been updated.' });
			}
		}
	});

	let activeTab = $state('profile');
</script>

{#snippet profileTab()}
	<Card variant="flat" class="space-y-6">
		<form method="POST" action="?/profile" use:profileEnhance class="space-y-4">
			<FormField
				label="Name"
				id="name"
				type="text"
				name="name"
				placeholder="Your name"
				bind:value={$profileForm.name}
				error={$profileErrors.name}
			/>

			<FormField
				label="Email"
				id="email"
				type="email"
				name="email"
				placeholder="you@example.com"
				required
				bind:value={$profileForm.email}
				error={$profileErrors.email}
			/>

			<div class="flex justify-end pt-4 border-t border-surface-200-700">
				<Button
					type="submit"
					variant="primary"
					loading={$profileSubmitting}
					loadingText="Saving…"
				>
					Save Profile
				</Button>
			</div>
		</form>
	</Card>
{/snippet}

{#snippet passwordTab()}
	<Card variant="flat" class="space-y-6">
		<form method="POST" action="?/password" use:passwordEnhance class="space-y-4">
			<PasswordInput
				id="currentPassword"
				label="Current password"
				name="currentPassword"
				placeholder="••••••••"
				required
				bind:value={$passwordForm.currentPassword}
				error={$passwordErrors.currentPassword}
			/>

			<PasswordInput
				id="newPassword"
				label="New password"
				name="password"
				placeholder="••••••••"
				required
				showStrength
				bind:value={$passwordForm.password}
				error={$passwordErrors.password}
			/>

			<PasswordInput
				id="confirmPassword"
				label="Confirm new password"
				name="confirmPassword"
				placeholder="••••••••"
				required
				bind:value={$passwordForm.confirmPassword}
				error={$passwordErrors.confirmPassword}
			/>

			<div class="flex justify-end pt-4 border-t border-surface-200-700">
				<Button
					type="submit"
					variant="primary"
					loading={$passwordSubmitting}
					loadingText="Changing…"
				>
					Change Password
				</Button>
			</div>
		</form>
	</Card>
{/snippet}

<svelte:head>
	<title>Account — Dashboard — SvelteForge</title>
</svelte:head>

<div class="flex flex-col gap-8">
	<section class="flex flex-col gap-2">
		<h1 class="text-3xl font-bold text-surface-50-950">Account</h1>
		<p class="text-surface-500">Manage your profile and security settings.</p>
	</section>

	<Tabs
		bind:value={activeTab}
		tabs={[
			{ value: 'profile', label: 'Profile', content: profileTab },
			{ value: 'password', label: 'Password', content: passwordTab }
		]}
		variant="underline"
	/>
</div>
