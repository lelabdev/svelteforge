<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import { Card } from '$lib/components/svforge/ui';
	import { Button } from '$lib/components/svforge/primitives';
</script>

<svelte:head>
	<title>{m.home_title()}</title>
</svelte:head>

<main class="mx-auto max-w-7xl px-4 py-8">
	<section class="space-y-6 py-8 text-center">
		<h1 class="text-5xl font-bold">
			{m.home_welcome()} <span class="text-primary-500">SvelteForge</span>
		</h1>
		<p class="mx-auto max-w-2xl text-xl text-surface-500">
			{m.home_subtitle()}
		</p>
		<div class="flex justify-center gap-4">
			<Button href="/demo-ui" size="lg">{m.home_view_components()}</Button>
			<Button variant="outlined" size="lg" href="https://github.com/ludoloops/svelteforge">{m.home_github()}</Button>
		</div>
	</section>

	<section class="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
		<Card variant="elevated">
			<h3 class="mb-2 text-lg font-bold">{m.home_card_stack_title()}</h3>
			<p class="text-surface-500">{m.home_card_stack_desc()}</p>
		</Card>
		<Card variant="elevated">
			<h3 class="mb-2 text-lg font-bold">{m.home_card_custom_title()}</h3>
			<p class="text-surface-500">{m.home_card_custom_desc()}</p>
		</Card>
		<Card variant="elevated">
			<h3 class="mb-2 text-lg font-bold">{m.home_card_ready_title()}</h3>
			<p class="text-surface-500">{m.home_card_ready_desc()}</p>
		</Card>
	</section>
</main>
