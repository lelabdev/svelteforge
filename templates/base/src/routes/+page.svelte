<script lang="ts">
	import { Button, Card } from '$lib/components/ui';
</script>

<svelte:head>
	<title>SvelteForge</title>
</svelte:head>

<main class="max-w-container mx-auto px-element py-section">
	<section class="text-center space-y-6 py-section">
		<h1 class="text-5xl font-heading font-bold">
			Welcome to <span class="text-primary-500">SvelteForge</span>
		</h1>
		<p class="text-xl text-surface-500 max-w-2xl mx-auto">
			A modern SvelteKit starter kit built on Skeleton UI with Tailwind CSS.
		</p>
		<div class="flex justify-center gap-4">
			<Button href="/demo-ui" size="lg">View Components</Button>
			<Button variant="outlined" size="lg" href="https://github.com/ludoloops/svelteforge">GitHub</Button>
		</div>
	</section>

	<section class="grid grid-cols-1 md:grid-cols-3 gap-group mt-section">
		<Card variant="elevated">
			<h3 class="font-heading font-bold text-lg mb-2">Modern Stack</h3>
			<p class="text-surface-500">SvelteKit + Tailwind v4 + Skeleton UI v4. Always up to date.</p>
		</Card>
		<Card variant="elevated">
			<h3 class="font-heading font-bold text-lg mb-2">Customizable</h3>
			<p class="text-surface-500">Full theme system with oklch colors. Make it yours.</p>
		</Card>
		<Card variant="elevated">
			<h3 class="font-heading font-bold text-lg mb-2">Production Ready</h3>
			<p class="text-surface-500">Prettier, ESLint, TypeScript, responsive. Ship with confidence.</p>
		</Card>
	</section>
</main>
