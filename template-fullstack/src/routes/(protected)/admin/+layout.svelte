<script lang="ts">
	import AdminSidebar from '$lib/components/layout/AdminSidebar.svelte';
	import type { LayoutData } from './$types';

	let { data, children }: { data: LayoutData; children: any } = $props();
</script>

<div class="flex min-h-screen bg-surface-50-950">
	<AdminSidebar user={data.user} />
	<main class="flex-1 overflow-y-auto p-6 lg:p-8">
		{@render children()}
	</main>
</div>
