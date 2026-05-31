<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { Button, Input, Card } from '$lib/components/svforge/ui';
	import ThemeToggle from '$lib/components/svforge/ui/ThemeToggle.svelte';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
	let email = $state('');
	let password = $state('');
	let loading = $state(false);
</script>

<svelte:head>
	<title>Login — SvelteForge</title>
</svelte:head>

<main class="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-950 p-element">
	<div class="w-full max-w-modal">
		<div class="flex justify-end mb-4">
			<ThemeToggle />
		</div>

		<Card variant="elevated">
			<div class="text-center mb-6">
				<h1 class="text-2xl font-heading font-bold">Welcome back</h1>
				<p class="text-surface-500 mt-1">Sign in to your account</p>
			</div>

			{#if form?.message}
				<div class="alert alert-error mb-4">{form.message}</div>
			{/if}

			<form method="POST" use:enhance={() => {
				loading = true;
				return async ({ update }) => {
					const result = await update({ reset: false });
					loading = false;
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					if ((result as any)?.type === 'success') {
						const callbackURL = new URLSearchParams(window.location.search).get('callbackURL');
						goto(callbackURL || '/admin');
					}
				};
			}} class="space-y-4">
				<Input label="Email" type="email" name="email" bind:value={email} placeholder="you@example.com" required />
				<Input label="Password" type="password" name="password" bind:value={password} placeholder="••••••••" required />
				<Button type="submit" class="w-full" disabled={loading}>
					{loading ? 'Signing in...' : 'Sign In'}
				</Button>
			</form>
		</Card>
	</div>
</main>
