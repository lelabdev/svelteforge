<script lang="ts">
	import { Card } from '$lib/components/ui';

	// Define the data structure for the cards
	type IncludeItem = {
		title: string;
		description: string;
	};

	// Items to keep
	const keepItems: IncludeItem[] = [
		{
			title: 'Authentication System',
			description: '- /login, /register, hooks.server.ts'
		},
		{
			title: 'UI Component Library',
			description: '- src/lib/components/ui/'
		},
		{
			title: 'Database Setup',
			description: '- src/lib/server/db/'
		},
		{
			title: 'Security Helpers',
			description: '- src/lib/server/security.ts'
		},
		{
			title: 'Type Definitions',
			description: '- src/app.d.ts'
		}
	];

	// Items to delete
	const deleteItems: IncludeItem[] = [
		{
			title: '/demo-ui route',
			description: '- Delete after exploring components'
		},
		{
			title: '/carta route',
			description: '- Delete if not using Markdown'
		},
		{
			title: '/dashboard & /admin',
			description: '- Example protected routes'
		},
		{
			title: 'src/lib/components/Carta/',
			description: '- If not using Markdown editor'
		},
		{
			title: 'src/lib/components/SortDnD/',
			description: '- If not using drag & drop'
		}
	];
</script>

<section class="bg-surface-100 px-6 py-20">
	<div class="mx-auto max-w-7xl">
		<div class="grid gap-12 lg:grid-cols-2">
			<!-- What to Keep column -->
			<div>
				<div class="mb-6 flex items-center gap-3">
					<div class="rounded-full bg-success-500/20 p-2">
						<div class="h-3 w-3 rounded-full bg-success-500"></div>
					</div>
					<h2 class="text-3xl font-bold text-surface-900-50">✅ What to Keep</h2>
				</div>
				<div class="space-y-3">
					{#each keepItems as item, index (index)}
						<Card
							variant="flat"
							class="border-l-4 border-success-500 bg-success-50-950/80 p-4 transition-all hover:scale-102 hover:shadow-md"
						>
							<strong class="text-success-700-300">{item.title}</strong>
							<span class="text-surface-600-400">{item.description}</span>
						</Card>
					{/each}
				</div>
			</div>

			<!-- What to Delete column -->
			<div>
				<div class="mb-6 flex items-center gap-3">
					<div class="rounded-full bg-error-500/20 p-2">
						<div class="h-3 w-3 rounded-full bg-error-500"></div>
					</div>
					<h2 class="text-3xl font-bold text-surface-950-50">❌ What to Delete (Examples)</h2>
				</div>
				<div class="space-y-3">
					{#each deleteItems as item, index (index)}
						<Card
							variant="flat"
							class="border-l-4 border-error-500 bg-error-200-800/40 p-4 transition-all hover:scale-102 hover:shadow-md"
						>
							<strong class="text-error-700-300">{item.title}</strong>
							<span class="text-surface-600-400">{item.description}</span>
						</Card>
					{/each}
				</div>
			</div>
		</div>
	</div>
</section>
