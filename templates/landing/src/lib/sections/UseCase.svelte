<script>
	import { Card } from '$lib/components/ui';
	import Icon from '$lib/components/icons/Icon.svelte';

	const points = [
		{
			icon: 'shieldCheck',
			title: 'MIT license — use it however you want',
			borderColor: 'border-primary-500',
			iconBg: 'bg-primary-400-600/40',
			textColor: 'text-primary-500'
		},
		{
			icon: 'arrowSquareOut',
			title: 'No vendor lock-in — it\'s your codebase',
			borderColor: 'border-secondary-500',
			iconBg: 'bg-secondary-400-600/40',
			textColor: 'text-secondary-500'
		},
		{
			icon: 'clock',
			title: 'Built on sv create — you follow SvelteKit, not a fork',
			borderColor: 'border-tertiary-500',
			iconBg: 'bg-tertiary-400-600/40',
			textColor: 'text-tertiary-500'
		},
		{
			icon: 'airplane',
			title: 'Svelte community — one niche, done right',
			borderColor: 'border-success-500',
			iconBg: 'bg-success-400-600/40',
			textColor: 'text-success-500'
		}
	];
</script>

<section class="relative bg-surface-50 px-6 py-20">
	<div class="mx-auto max-w-4xl">
		<div class="mb-16 text-center">
			<h2 class="title mb-4 text-4xl font-bold text-surface-950-50">Open source. For real.</h2>
			<p class="subtitle text-xl text-surface-600">
				No hidden freemium, no surprise at upgrade time. The code is there, it stays there.
			</p>
		</div>

		<div class="grid gap-6 sm:grid-cols-2">
			{#each points as point (point)}
				<Card variant="flat" class="border-l-4 {point.borderColor} bg-surface-100-900 p-6 transition-all hover:scale-105 hover:shadow-lg">
					<div class="flex items-start gap-4">
						<div class="rounded-lg {point.iconBg} p-3">
							<Icon name={point.icon} size={24} class={point.textColor} />
						</div>
						<p class="subtitle text-lg font-medium text-surface-950-50">{point.title}</p>
					</div>
				</Card>
			{/each}
		</div>
	</div>
</section>
