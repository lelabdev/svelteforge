<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { Footer, Navbar } from '$lib/components';
	import { themeStore } from '$lib/utils/theme.svelte';
	import '../app.css';

	interface LayoutData {
		user?: { id: string; name?: string; email: string; role?: string; image?: string } | null;
	}

	let { children, data }: { children: any; data: LayoutData } = $props();

	onMount(() => {
		themeStore.init();
	});

	let isAdminPage = $derived($page.url.pathname.startsWith('/admin'));
</script>

<div class="flex flex-col min-h-screen">
	{#if !isAdminPage}
		<Navbar user={data.user} />
	{/if}

	<main class="flex-1 {!isAdminPage ? 'pt-16' : 'h-screen'}">
		{@render children()}
	</main>

	{#if !isAdminPage}
		<Footer />
	{/if}
</div>
