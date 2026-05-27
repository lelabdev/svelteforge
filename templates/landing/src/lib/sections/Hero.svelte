<script lang="ts">
	import { Badge, Button } from '$lib/components/ui';
	import Icon from '$lib/components/icons/Icon.svelte';
	import Logo from '$lib/components/Logo.svelte';
	import links from '$lib/data/links';
</script>

<section class="relative overflow-hidden px-6 py-20 sm:py-32">
	<div class="mx-auto max-w-7xl">
		<div class="text-center">
			<div class="mb-8 flex flex-wrap justify-center gap-4">
				<Badge variant="primary">Open Source</Badge>
				<Badge variant="success">Free Forever</Badge>
			</div>
			<Logo class="text-5xl sm:text-7xl" />

			<p class="title mx-auto mb-4 max-w-2xl text-2xl font-semibold text-primary-500">
				Stop rebuilding. Start creating.
			</p>

			<p class="subtitle mx-auto mb-12 max-w-3xl text-lg leading-8 text-surface-600-400">
				The SvelteKit boilerplate built on <strong>sv create</strong>, powered by Skeleton.
				Auth, DB, 40+ components — everything wired, nothing to hack.
			</p>

			<div class="flex flex-wrap items-center justify-center gap-4">
				<Button
					variant="primary"
					size="lg"
					class="px-8 py-4 text-lg font-semibold"
					onclick={() => navigator.clipboard.writeText('bunx create-svelteforge')}
				>
					🚀 Get Started
				</Button>
				<Button
					variant="ghost"
					size="lg"
					href={links.githubForge.href}
					target="_blank"
					class="px-8 py-4 text-lg font-semibold"
				>
					<Icon name="code" size={20} class="mr-2" />
					View on GitHub
				</Button>
			</div>

			<p class="font-code mt-4 text-sm text-surface-500">
				bunx create-svelteforge
			</p>
		</div>
	</div>
</section>
