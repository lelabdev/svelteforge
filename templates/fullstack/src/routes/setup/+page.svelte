<script lang="ts">
	import { Button, Input, Card } from '$lib/components/svforge/ui';
	import ThemeToggle from '$lib/components/svforge/ui/ThemeToggle.svelte';
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
</script>

<svelte:head>
	<title>Setup — SvelteForge</title>
</svelte:head>

<main class="min-h-screen flex items-center justify-center p-4">
	<div class="w-full max-w-sm space-y-6">
		<div class="text-center space-y-2">
			<h1 class="text-2xl font-heading font-bold">Create Admin</h1>
			<p class="text-surface-500 text-sm">First user becomes admin automatically.</p>
		</div>

		<Card>
			<form method="POST" class="space-y-4" use:enhance>
				{#if form?.error}
					<p class="text-error-500 text-sm">{form.error}</p>
				{/if}

				<Input name="name" label="Name" placeholder="Admin" required />
				<Input name="email" label="Email" type="email" placeholder="admin@example.com" required />
				<Input name="password" label="Password" type="password" placeholder="Min. 8 characters" required />
				<Button type="submit" class="w-full">Create & Continue</Button>
			</form>
		</Card>

		<div class="flex justify-center">
			<ThemeToggle />
		</div>

		<p class="text-center text-xs text-surface-500">
			This page is only available in development mode.
		</p>
	</div>
</main>
