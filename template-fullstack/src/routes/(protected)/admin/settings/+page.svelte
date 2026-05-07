<script lang="ts">
	import type { PageData } from './$types';
	import Tabs from '$lib/components/ui/Tabs.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Switch from '$lib/components/ui/Switch.svelte';
	import Input from '$lib/components/ui/form/Input.svelte';
	import Select from '$lib/components/ui/form/Select.svelte';
	import { addToast } from '$lib/components/ui/toast-state.svelte';

	let { data }: { data: PageData } = $props();

	// Reactive settings state with sensible defaults
	let settings = $state({
		appName: 'SvelteForge',
		appDescription: 'A full-stack SvelteKit application template',
		logoUrl: '',
		allowRegistration: true,
		defaultRole: 'user',
		requireEmailVerification: false,
		enableEmailNotifications: false,
		notificationEmail: 'admin@example.com',
		sendOnNewUserSignup: true
	});

	let activeTab = $state('general');

	function handleSave() {
		// Client-side only — no server persistence
		addToast({ kind: 'success', title: 'Settings saved' });
	}
</script>

{#snippet generalTab()}
	<Card variant="flat" class="space-y-6">
		<div class="space-y-4">
			<div class="space-y-1">
				<label for="app-name" class="label">
					<span class="label-text">App Name</span>
				</label>
				<p class="text-surface-500" style="font-size: var(--text-caption)">
					The display name of your application.
				</p>
				<Input id="app-name" bind:value={settings.appName} placeholder="My App" />
			</div>

			<div class="space-y-1">
				<label for="app-description" class="label">
					<span class="label-text">App Description</span>
				</label>
				<p class="text-surface-500" style="font-size: var(--text-caption)">
					A short description used in meta tags and the homepage.
				</p>
				<Input
					id="app-description"
					bind:value={settings.appDescription}
					placeholder="A brief description of your app"
				/>
			</div>

			<div class="space-y-1">
				<label for="logo-url" class="label">
					<span class="label-text">Logo URL</span>
				</label>
				<p class="text-surface-500" style="font-size: var(--text-caption)">
					URL to your app logo image. Leave empty for the default.
				</p>
				<Input
					id="logo-url"
					bind:value={settings.logoUrl}
					placeholder="https://example.com/logo.png"
				/>
			</div>
		</div>

		<div class="flex justify-end pt-4 border-t border-surface-200-700">
			<Button variant="primary" onclick={handleSave}>Save Changes</Button>
		</div>
	</Card>
{/snippet}

{#snippet authTab()}
	<Card variant="flat" class="space-y-6">
		<div class="space-y-5">
			<Switch
				checked={settings.allowRegistration}
				onCheckedChange={(val) => (settings.allowRegistration = val)}
				label="Allow Registration"
				description="Enable new users to create accounts on their own."
			/>

			<div class="space-y-1">
				<Select
					id="default-role"
					bind:value={settings.defaultRole}
					label="Default Role for New Users"
					options={[
						{ value: 'user', label: 'User' },
						{ value: 'admin', label: 'Admin' }
					]}
				/>
				<p class="text-surface-500" style="font-size: var(--text-caption)">
					Newly registered users will be assigned this role automatically.
				</p>
			</div>

			<Switch
				checked={settings.requireEmailVerification}
				onCheckedChange={(val) => (settings.requireEmailVerification = val)}
				label="Require Email Verification"
				description="Users must verify their email before accessing the platform."
			/>
		</div>

		<div class="flex justify-end pt-4 border-t border-surface-200-700">
			<Button variant="primary" onclick={handleSave}>Save Changes</Button>
		</div>
	</Card>
{/snippet}

{#snippet notificationsTab()}
	<Card variant="flat" class="space-y-6">
		<div class="space-y-5">
			<Switch
				checked={settings.enableEmailNotifications}
				onCheckedChange={(val) => (settings.enableEmailNotifications = val)}
				label="Enable Email Notifications"
				description="Allow the system to send email notifications."
			/>

			<div class="space-y-1">
				<label for="notification-email" class="label">
					<span class="label-text">Notification Email Address</span>
				</label>
				<p class="text-surface-500" style="font-size: var(--text-caption)">
					Email address used as the sender for system notifications.
				</p>
				<Input
					id="notification-email"
					type="email"
					bind:value={settings.notificationEmail}
					placeholder="noreply@example.com"
				/>
			</div>

			<Switch
				checked={settings.sendOnNewUserSignup}
				onCheckedChange={(val) => (settings.sendOnNewUserSignup = val)}
				label="Send on New User Signup"
				description="Notify admins when a new user registers."
			/>
		</div>

		<div class="flex justify-end pt-4 border-t border-surface-200-700">
			<Button variant="primary" onclick={handleSave}>Save Changes</Button>
		</div>
	</Card>
{/snippet}

<svelte:head>
	<title>Settings — Admin — SvelteForge</title>
</svelte:head>

<div class="flex flex-col gap-8">
	<section class="flex flex-col gap-2">
		<h1 class="text-3xl font-bold text-surface-50-950">Settings</h1>
		<p class="text-surface-500">Configure your application settings.</p>
	</section>

	<Tabs
		bind:value={activeTab}
		tabs={[
			{ value: 'general', label: 'General', content: generalTab },
			{ value: 'auth', label: 'Authentication', content: authTab },
			{ value: 'notifications', label: 'Notifications', content: notificationsTab }
		]}
		variant="underline"
	/>
</div>
