<script lang="ts">
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();
</script>

<div class="space-y-6">
	<h2 class="text-2xl font-black uppercase tracking-tight">Admin Dashboard</h2>

	<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
		<div class="card p-4 space-y-2">
			<h3 class="font-semibold text-lg">Current User</h3>
			<p class="text-sm text-surface-500">Name: {data.user.name}</p>
			<p class="text-sm text-surface-500">Email: {data.user.email}</p>
		</div>

		<div class="card p-4 space-y-2">
			<h3 class="font-semibold text-lg">Navigation</h3>
			<nav class="space-y-1">
				<a href="/dashboard" class="block text-sm text-primary-500 hover:underline">
					Dashboard
				</a>
			</nav>
		</div>
	</div>
</div>
