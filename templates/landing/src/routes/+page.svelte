<script lang="ts">
	import Hero from '$lib/sections/Hero.svelte';
	import Stats from '$lib/sections/Stats.svelte';
	import Why from '$lib/sections/Why.svelte';
	import Stack from '$lib/sections/Stack.svelte';
	import UseCase from '$lib/sections/UseCase.svelte';
	import Include from '$lib/sections/Include.svelte';
	import CTA from '$lib/sections/CTA.svelte';
	import QuickStart from '$lib/sections/QuickStart.svelte';
</script>

<svelte:head>
	<title>SvelteForge — Production-Ready SvelteKit Starter Kit</title>
	<meta
		name="description"
		content="Complete, reusable SvelteKit boilerplate with authentication, database, and 30+ UI components. Save 20+ hours on every new project."
	/>
</svelte:head>

<div class="relative min-h-screen">
	<main>
		<Hero />
		<Stats />
		<Why />
		<Stack />
		<UseCase />
		<Include />
		<CTA />
		<QuickStart />
	</main>
</div>
