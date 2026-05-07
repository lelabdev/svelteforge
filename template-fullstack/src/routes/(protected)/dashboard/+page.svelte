<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const displayName = $derived(data.user.name ?? data.user.email);
	const initials = $derived(
		(data.user.name ?? data.user.email)
			.split(' ')
			.map((part: string) => part[0])
			.slice(0, 2)
			.join('')
			.toUpperCase()
	);
</script>

<svelte:head>
	<title>Dashboard — SvelteForge</title>
</svelte:head>

<div class="flex flex-col gap-8">
	<!-- Welcome -->
	<section class="flex flex-col gap-2">
		<h1 class="text-3xl font-bold text-surface-50-950">
			Welcome back, {displayName}
		</h1>
		<p class="text-surface-500">Here's an overview of your account.</p>
	</section>

	<!-- Profile Card -->
	<div class="card" style="max-width: 480px;">
		<div class="card-content flex flex-col gap-6 p-6">
			<!-- Avatar + Name Row -->
			<div class="flex items-center gap-4">
				<div
					class="flex items-center justify-center rounded-full bg-primary-500"
					style="width: 56px; height: 56px;"
				>
					<span class="text-surface-50-950 font-semibold text-lg">
						{initials}
					</span>
				</div>
				<div class="flex flex-col">
					<span class="text-lg font-semibold text-surface-50-950">
						{displayName}
					</span>
					<span class="text-surface-500 text-sm">
						{data.user.email}
					</span>
				</div>
			</div>

			<!-- Divider -->
			<hr class="border-surface-200-800" />

			<!-- Details -->
			<div class="flex flex-col gap-3">
				<div class="flex items-center justify-between">
					<span class="text-surface-500 text-sm">Email</span>
					<span class="text-surface-50-950 text-sm font-medium">
						{data.user.email}
					</span>
				</div>

				{#if data.user.role}
					<div class="flex items-center justify-between">
						<span class="text-surface-500 text-sm">Role</span>
						<span
							class="inline-flex items-center rounded-full bg-primary-500/15 px-2.5 py-0.5 text-xs font-medium text-primary-700-300"
						>
							{data.user.role}
						</span>
					</div>
				{/if}

				{#if data.user.name}
					<div class="flex items-center justify-between">
						<span class="text-surface-500 text-sm">Display Name</span>
						<span class="text-surface-50-950 text-sm font-medium">
							{data.user.name}
						</span>
					</div>
				{/if}

				<div class="flex items-center justify-between">
					<span class="text-surface-500 text-sm">User ID</span>
					<span class="text-surface-50-950 text-xs font-mono">
						{data.user.id.slice(0, 12)}…
					</span>
				</div>
			</div>
		</div>
	</div>
</div>
