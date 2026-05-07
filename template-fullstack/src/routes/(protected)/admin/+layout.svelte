<script lang="ts">
	import AdminSidebar from '$lib/components/layout/AdminSidebar.svelte';
	import Breadcrumb from '$lib/components/ui/Breadcrumb.svelte';
	import { page } from '$app/state';
	import type { LayoutData } from './$types';

	let { data, children }: { data: LayoutData; children: any } = $props();

	const breadcrumbItems = $derived.by(() => {
		const segments = page.url.pathname
			.split('/')
			.filter(Boolean);

		// Find the index of "admin" in the segments
		const adminIndex = segments.indexOf('admin');
		if (adminIndex === -1) return [];

		// Only include segments from "admin" onward
		const adminSegments = segments.slice(adminIndex);

		return adminSegments.map((segment, i) => {
			const label = segment.charAt(0).toUpperCase() + segment.slice(1);
			if (i === 0) {
				// First segment always links to /admin
				return { label, href: '/admin' };
			}
			// Last segment has no href (current page)
			if (i === adminSegments.length - 1) {
				return { label };
			}
			// Middle segments link to their accumulated path
			const href = '/' + segments.slice(0, adminIndex + i + 1).join('/');
			return { label, href };
		});
	});
</script>

<div class="flex min-h-screen bg-surface-50-950">
	<AdminSidebar user={data.user} />
	<main class="flex-1 overflow-y-auto p-6 lg:p-8">
		{#if breadcrumbItems.length > 0}
			<div class="hidden md:block mb-4">
				<Breadcrumb items={breadcrumbItems} />
			</div>
		{/if}
		{@render children()}
	</main>
</div>
