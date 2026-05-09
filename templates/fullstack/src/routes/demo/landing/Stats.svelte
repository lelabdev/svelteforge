<script lang="ts">
	import { Card } from '$lib/components/ui';
	import DynamicCounter from '$lib/components/anim/DynamicCounter.svelte';

	const stats = [
		{ label: 'Hours Saved', suffix: '+', value: 20, description: 'On every new project', color: 'primary' },
		{ label: 'Components', suffix: '+', value: 30, description: 'Ready to use', color: 'secondary' },
		{ label: 'Lines of Code', suffix: '+', value: 5000, description: 'Pre-written for you', color: 'tertiary' },
		{ label: 'Time to Deploy', value: 10, prefix: '<', suffix: 'min', description: 'From clone to production', color: 'success' }
	];
</script>

<section class="relative bg-surface-100-900 px-6 py-16">
	<div class="mx-auto max-w-7xl">
		<div class="mb-12 text-center">
			<h2 class="title mb-3 text-2xl font-bold text-surface-950-50 sm:text-3xl">You know the routine.</h2>
			<p class="subtitle text-surface-600-400">Every project, the same thing.</p>
		</div>

		<div class="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
			{#each stats as stat, i (stat)}
				<Card variant="flat" class="border-t-4 p-8 text-center border-{stat.color}-500">
					<span class="title mb-2 block text-4xl font-bold text-{stat.color}-500">
						{stat.prefix ?? ''}<DynamicCounter suffix={stat.suffix} target={stat.value} duration={3} />
					</span>
					<div class="mb-1 text-xl font-semibold text-surface-900-50">{stat.label}</div>
					<div class="text-sm text-surface-600-400">{stat.description}</div>
				</Card>
			{/each}
		</div>

		<div class="mt-10 text-center">
			<p class="subtitle mb-4 text-lg text-surface-600-400">
				15 hours rebuilding what already exists. And you haven't even started your product.
			</p>
			<p class="title text-xl font-bold text-primary-500">
				What if all of this took 2 minutes?
			</p>
		</div>
	</div>
</section>
