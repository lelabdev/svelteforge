<script lang="ts">
	import { Badge, Card } from '$lib/components/ui';
	import Icon from '$lib/components/icons/Icon.svelte';

	const steps = [
		{
			number: '1',
			title: 'Create',
			description: 'One CLI command. Choose Landing or Full Stack.',
			icon: 'plus-circle'
		},
		{
			number: '2',
			title: 'Configure',
			description: 'Setup script generates .env, DB, admin. Zero files to edit.',
			icon: 'wrench'
		},
		{
			number: '3',
			title: 'Ship',
			description: 'Everything wired. Start coding what makes your project unique.',
			icon: 'rocket-launch'
		}
	];

	const commands = [
		'bunx sv create my-project --template minimal --types ts --add tailwindcss',
		'cd my-project',
		'bunx sv add @lelabdev/svelteforge=template:landing',
		'bun run dev'
	];
</script>

<section class="bg-surface-100-900 px-6 py-20">
	<div class="mx-auto max-w-5xl">
		<div class="mb-12 text-center">
			<h2 class="title mb-4 text-4xl font-bold text-surface-950-50">How it works</h2>
			<p class="subtitle text-xl text-surface-600-400">Three steps. Not thirty.</p>
		</div>

		<!-- 3 Steps -->
		<div class="mb-12 grid gap-8 sm:grid-cols-3">
			{#each steps as step (step)}
				<div class="text-center">
					<div
						class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-500 text-xl font-bold text-white"
					>
						{step.number}
					</div>
					<h3 class="title mb-2 text-xl font-semibold text-surface-950-50">
						{step.title}
					</h3>
					<p class="subtitle text-surface-600-400">{step.description}</p>
				</div>
			{/each}
		</div>

		<!-- Code Block -->
		<Card variant="flat" class="bg-surface-800-900 p-0" noPadding>
			<div class="p-8 font-mono text-sm text-surface-200-700">
				{#each commands as cmd, i}
					<div class="mb-2 flex items-center gap-2">
						<span class="text-surface-500">➜</span>
						<span class="text-primary-400">$</span>
						<span>{cmd}</span>
					</div>
				{/each}
			</div>
		</Card>

		<!-- Template Badges -->
		<div class="mt-12 text-center">
			<p class="subtitle mb-6 text-lg text-surface-600-400">Choose your template:</p>
			<div class="flex flex-wrap justify-center gap-3">
				<Badge variant="primary">Full Stack — Auth, DB, 40+ components</Badge>
				<Badge variant="surface">Landing — Minimal, UI only</Badge>
			</div>
		</div>
	</div>
</section>
