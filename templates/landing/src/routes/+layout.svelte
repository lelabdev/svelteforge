<script lang="ts">
	import { onMount } from 'svelte';
	import { Footer, Navbar } from '$lib/components';
	import { themeStore } from '$lib/utils/theme.svelte';
	import '../app.css';

	let { children } = $props();

	onMount(() => {
		themeStore.init();
	});
</script>

<div class="flex flex-col min-h-screen">
	<Navbar />
	<main class="flex-1 pt-16">{@render children()}</main>
	<Footer />
</div>
