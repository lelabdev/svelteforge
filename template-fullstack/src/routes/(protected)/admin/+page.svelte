<script lang="ts">
	import type { PageData } from './$types';
	import Card from '$lib/components/ui/Card.svelte';
	import Icon from '$lib/components/icons/Icon.svelte';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Admin Dashboard — SvelteForge</title>
</svelte:head>

<div class="flex flex-col gap-8">
	<!-- Header -->
	<section class="flex flex-col gap-2">
		<h1 class="text-3xl font-bold text-surface-50-950">Admin Dashboard</h1>
		<p class="text-surface-500">Overview of your application.</p>
	</section>

	<!-- Stat Cards -->
	<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
		<Card title="Users" variant="flat">
			<div class="flex items-center gap-4">
				<div class="flex items-center justify-center rounded-lg bg-primary-500/10 text-primary-500 p-3">
					<Icon name="users" size={24} />
				</div>
				<div class="flex flex-col">
					<span class="text-2xl font-bold text-surface-50-950">—</span>
					<span class="text-sm text-surface-500">Total users</span>
				</div>
			</div>
		</Card>

		<Card title="Active Sessions" variant="flat">
			<div class="flex items-center gap-4">
				<div class="flex items-center justify-center rounded-lg bg-success-500/10 text-success-500 p-3">
					<Icon name="shieldCheck" size={24} />
				</div>
				<div class="flex flex-col">
					<span class="text-2xl font-bold text-surface-50-950">—</span>
					<span class="text-sm text-surface-500">Currently online</span>
				</div>
			</div>
		</Card>

		<Card title="System" variant="flat">
			<div class="flex items-center gap-4">
				<div class="flex items-center justify-center rounded-lg bg-secondary-500/10 text-secondary-500 p-3">
					<Icon name="settings" size={24} />
				</div>
				<div class="flex flex-col">
					<span class="text-2xl font-bold text-surface-50-950">OK</span>
					<span class="text-sm text-surface-500">All systems operational</span>
				</div>
			</div>
		</Card>
	</div>
</div>
