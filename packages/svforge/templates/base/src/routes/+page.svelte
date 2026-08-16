<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import { Card } from '$lib/components/svforge/ui';
	import { Button } from '$lib/components/svforge/primitives';
</script>

<svelte:head>
	<title>{m.home_title()}</title>
</svelte:head>

<main class="max-w-container mx-auto px-element py-section">
	<section class="text-center space-y-6 py-section">
		<h1 class="text-5xl font-heading font-bold">
			{m.home_welcome()} <span class="text-primary-500">SvelteForge</span>
		</h1>
		<p class="text-xl text-surface-500 max-w-2xl mx-auto">
			{m.home_subtitle()}
		</p>
		<div class="flex justify-center gap-4">
			<Button href="/demo-ui" size="lg">{m.home_view_components()}</Button>
			<Button variant="outlined" size="lg" href="https://github.com/ludoloops/svelteforge">{m.home_github()}</Button>
		</div>
	</section>

	<section class="grid grid-cols-1 md:grid-cols-3 gap-group mt-section">
		<Card variant="elevated">
			<h3 class="font-heading font-bold text-lg mb-2">{m.home_card_stack_title()}</h3>
			<p class="text-surface-500">{m.home_card_stack_desc()}</p>
		</Card>
		<Card variant="elevated">
			<h3 class="font-heading font-bold text-lg mb-2">{m.home_card_custom_title()}</h3>
			<p class="text-surface-500">{m.home_card_custom_desc()}</p>
		</Card>
		<Card variant="elevated">
			<h3 class="font-heading font-bold text-lg mb-2">{m.home_card_ready_title()}</h3>
			<p class="text-surface-500">{m.home_card_ready_desc()}</p>
		</Card>
	</section>
</main>
