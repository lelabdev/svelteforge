<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import { Card, AvatarInitial } from '$lib/components/svforge/ui';
	import { Badge } from '$lib/components/svforge/primitives';
	import { Button } from '$lib/components/svforge/primitives';
	import Users from 'phosphor-svelte/lib/Users';
	import ChartBar from 'phosphor-svelte/lib/ChartBar';
	import Clock from 'phosphor-svelte/lib/Clock';

	let { data } = $props();
</script>

<svelte:head>
	<title>{m.admin_title()}</title>
</svelte:head>

<div class="space-y-8">
	<div class="flex items-center justify-between">
		<div>
			<h2 class="text-2xl font-bold">{m.admin_dashboard()}</h2>
			<p class="text-surface-500">{m.admin_welcome_back({ name: data.user.name })}</p>
		</div>
		<Button href="/admin/users" size="sm">
			<Users size={16} class="mr-1" />
			{m.admin_manage_users()}
		</Button>
	</div>

	<!-- Stats -->
	<div class="grid grid-cols-1 gap-6 sm:grid-cols-3">
		<Card variant="elevated">
			<div class="flex items-center gap-3">
				<div class="rounded-container bg-primary-100-900 p-3">
					<Users size={24} class="text-primary-600-400" />
				</div>
				<div>
					<p class="text-sm text-surface-500">{m.admin_total_users()}</p>
					<p class="text-2xl font-bold">{data.stats.totalUsers}</p>
				</div>
			</div>
		</Card>
		<Card variant="elevated">
			<div class="flex items-center gap-3">
				<div class="rounded-container bg-success-100-900 p-3">
					<Clock size={24} class="text-success-600" />
				</div>
				<div>
					<p class="text-sm text-surface-500">{m.admin_active_sessions()}</p>
					<p class="text-2xl font-bold">{data.stats.activeSessions}</p>
				</div>
			</div>
		</Card>
		<Card variant="elevated">
			<div class="flex items-center gap-3">
				<div class="rounded-container bg-secondary-100-900 p-3">
					<ChartBar size={24} class="text-secondary-600-400" />
				</div>
				<div>
					<p class="text-sm text-surface-500">{m.admin_this_week()}</p>
					<p class="text-2xl font-bold">{data.stats.newThisWeek}</p>
				</div>
			</div>
		</Card>
	</div>

	<!-- Recent Users -->
	<Card>
		{#snippet header()}
			<h3 class="font-bold">{m.admin_recent_users()}</h3>
		{/snippet}

		<div class="space-y-3">
			{#each data.recentUsers as u (u.id)}
				<div class="flex items-center justify-between border-b border-surface-100-800 py-2 last:border-0">
					<div class="flex items-center gap-3">
						<AvatarInitial name={u.name} />
						<div>
							<p class="text-sm font-medium">{u.name}</p>
							<p class="text-xs text-surface-500">{u.email}</p>
						</div>
					</div>
					<Badge color={u.emailVerified ? 'success' : 'warning'}>
						{u.emailVerified ? m.admin_verified() : m.admin_pending()}
					</Badge>
				</div>
			{/each}
		</div>
	</Card>
</div>
