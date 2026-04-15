<script lang="ts">
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();
</script>

<svelte:head>
	<title>Dashboard</title>
</svelte:head>

<div class="px-4 py-6 sm:px-6 sm:py-8 space-y-6 sm:space-y-8 max-w-4xl mx-auto">
	<div class="mb-6">
		<h1 class="text-2xl sm:text-3xl font-black uppercase tracking-tight">
			Hello, {data.user?.name || 'there'} 👋
		</h1>
		<p class="text-muted-foreground mt-1">Welcome to your dashboard</p>
	</div>

	<div class="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
		<!-- User Info Card -->
		<div class="card p-4 space-y-3">
			<h3 class="font-bold text-base">My Information</h3>
			<div class="space-y-2">
				<p class="text-sm">
					<span class="text-muted-foreground">Name:</span>
					{data.user?.name || '—'}
				</p>
				<p class="text-sm">
					<span class="text-muted-foreground">Email:</span>
					{data.user?.email || '—'}
				</p>
			</div>
		</div>

		<!-- Quick Links Card -->
		<div class="card p-4 space-y-3">
			<h3 class="font-bold text-base">Navigation</h3>
			<nav class="space-y-2">
				<a href="/" class="block text-sm text-primary-500 hover:underline">
					Back to Home
				</a>
			</nav>
		</div>
	</div>
</div>
