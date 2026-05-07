<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>User Management — Admin — SvelteForge</title>
</svelte:head>

<div class="flex flex-col gap-8">
	<section class="flex flex-col gap-2">
		<h1 class="text-3xl font-bold text-surface-50-950">User Management</h1>
		<p class="text-surface-500">Manage your application users.</p>
	</section>

	<div class="card bg-surface-50-800 border border-surface-200-700" style="border-radius: var(--radius-card)">
		<div class="card-body p-12 flex flex-col items-center justify-center gap-4 text-center">
			<span class="text-6xl">🚧</span>
			<h2 class="text-xl font-semibold text-surface-50-950">Coming Soon</h2>
			<p class="text-surface-500 max-w-md">
				User management features are under development. Check back soon!
			</p>
		</div>
	</div>
</div>
