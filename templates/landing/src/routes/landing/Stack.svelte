<script lang="ts">
	import { Badge, Card, Progress } from '$lib/components/ui';

	const techStack = [
		{ name: 'Svelte 5', version: 'Runes', color: 'bg-primary-500' },
		{ name: 'SvelteKit', version: '2.x', color: 'bg-secondary-500' },
		{ name: 'Skeleton UI', version: 'v4', color: 'bg-tertiary-500' },
		{ name: 'Tailwind CSS', version: 'v4', color: 'bg-success-500' },
		{ name: 'BetterAuth', version: '1.x', color: 'bg-warning-500' },
		{ name: 'Drizzle ORM', version: 'SQLite', color: 'bg-error-500' }
	] as const;
</script>

<section class="bg-surface-100-900 px-6 py-20">
	<div class="mx-auto max-w-7xl">
		<div class="mb-16 text-center">
			<h2 class="title mb-4 text-4xl font-bold text-surface-950-50">The stack</h2>
			<p class="subtitle text-xl text-surface-600-400">Not the latest trend. The right choice.</p>
		</div>

		<div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
			{#each techStack as tech, i (tech.name)}
				<Card variant="flat" class="transition-all hover:scale-105">
					<div class="p-6">
						<div class="mb-4 flex items-center justify-between">
							<h3 class="text-xl font-bold text-surface-950-50">{tech.name}</h3>
							<Badge>{tech.version}</Badge>
						</div>
						<Progress value={100} class={tech.color} size="md" />
					</div>
				</Card>
			{/each}
		</div>

		<div class="mt-12 text-center">
			<p class="subtitle text-lg text-surface-600-400">
				Plus: SuperForms, Zod v4, Tiptap, Pino, Lucide, Vitest, Playwright...
			</p>
		</div>
	</div>
</section>
