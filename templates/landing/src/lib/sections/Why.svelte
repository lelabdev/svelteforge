<script lang="ts">
	import FlyIn from '$lib/components/anim/FlyIn.svelte';
	import { Badge, Card } from '$lib/components/ui';
	import Icon from '$lib/components/icons/Icon.svelte';

	const features = [
		{
			icon: 'sailboat',
			title: 'Ready to ship in minutes',
			description:
				'One CLI, one command, everything wired. Auth, DB, components, setup scripts — your project is alive in 2 minutes.',
			highlight: 'CLI',
			variant: 'primary',
			bgColor: 'bg-primary-500/10',
			iconColor: 'text-primary-500'
		},
		{
			icon: 'shield',
			title: 'Built on the official foundation',
			description:
				'SvelteForge starts from sv create, the official SvelteKit tool. Not a fork, not a detour — you follow the ecosystem, not a single dev.',
			highlight: 'sv create',
			variant: 'secondary',
			bgColor: 'bg-secondary-500/10',
			iconColor: 'text-secondary-500'
		},
		{
			icon: 'checkCircle',
			title: 'Real auth, not a dummy',
			description:
				"BetterAuth with roles, sessions, password reset. Not a toy system — a production-grade setup you won't need to rewrite.",
			highlight: 'BetterAuth',
			variant: 'success',
			bgColor: 'bg-success-500/10',
			iconColor: 'text-success-500'
		},
		{
			icon: 'package',
			title: '40+ production-ready components',
			description:
				'Skeleton UI + custom components: DataTable, RichTextEditor, Stepper, Toast... Code your feature, not your base UI.',
			highlight: '40+',
			variant: 'surface',
			bgColor: 'bg-surface-500/10',
			iconColor: 'text-surface-500'
		},
		{
			icon: 'code',
			title: 'Database included',
			description:
				'SQLite + Drizzle ORM. Zero config. Setup creates the DB, tables, admin user. You jump straight into your schemas.',
			highlight: 'Drizzle',
			variant: 'warning',
			bgColor: 'bg-warning-500/10',
			iconColor: 'text-warning-500'
		},
		{
			icon: 'star',
			title: 'Your codebase, your rules',
			description:
				'Skeleton is an npm package, not copy-paste. Custom oklch theme, CSS tokens, clean structure. No lock-in, no tech debt.',
			highlight: 'No lock-in',
			variant: 'error',
			bgColor: 'bg-error-500/10',
			iconColor: 'text-error-500'
		}
	] as const;
</script>

<section class="relative bg-surface-100-900 px-6 py-20">
	<div class="mx-auto max-w-7xl">
		<div class="mb-16 text-center">
			<h2 class="title mb-4 text-4xl font-bold text-surface-950-50">
				Not a feature list. A foundation.
			</h2>
			<p class="subtitle mx-auto max-w-3xl text-xl text-surface-600-400">
				Every decision has been made so you don't have to make it.
			</p>
		</div>

		<div class="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
			{#each features as feature, i (feature.title)}
				<FlyIn direction="up" delay={i / 10}>
					<Card variant="flat" class="relative overflow-hidden transition-all hover:scale-105 hover:shadow-xl">
						<div class="absolute top-0 right-0 h-32 w-32 rounded-bl-full bg-linear-to-br from-{feature.variant === 'surface' ? 'surface' : feature.variant}-500/20 to-transparent"></div>
						<div class="relative p-6">
							<div class="mb-4 flex items-center justify-between">
								<div class="rounded-lg {feature.bgColor} p-3">
									<Icon name={feature.icon} size={24} class={feature.iconColor} />
								</div>
								<Badge variant={feature.variant}>{feature.highlight}</Badge>
							</div>
							<h3 class="title mb-3 text-xl font-bold text-surface-950-50">{feature.title}</h3>
							<p class="subtitle text-surface-600-400">{feature.description}</p>
						</div>
					</Card>
				</FlyIn>
			{/each}
		</div>
	</div>
</section>
