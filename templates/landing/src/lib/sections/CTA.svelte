<script>
	import { Button } from '$lib/components/ui';
	import Icon from '$lib/components/icons/Icon.svelte';
	import links from '$lib/data/links';
</script>

<section class="relative overflow-hidden px-6 py-20">
	<div class="absolute inset-0 bg-linear-to-r from-primary-500 via-secondary-500 to-tertiary-500"></div>
	<div class="absolute inset-0 bg-linear-to-b from-transparent via-primary-600/20 to-secondary-700/30"></div>

	<div class="relative mx-auto max-w-4xl text-center">
		<h2 class="title mb-6 text-4xl font-bold text-white drop-shadow-lg">
			Your next project deserves better than a copy-paste.
		</h2>
		<p class="subtitle mb-8 text-xl text-white/95 drop-shadow">
			Start with a clean foundation. Focus on what matters: your product.
		</p>

		<div class="flex flex-wrap items-center justify-center gap-4">
			<Button
				href={links.githubForge.href}
				target="_blank"
				variant="cta"
				class="bg-white px-8 py-4 text-lg font-semibold text-primary-600 shadow-xl hover:bg-surface-100 hover:shadow-2xl"
			>
				<Icon name="gitPullRequest" size={20} class="mr-2" />
				Star on GitHub
			</Button>
			<Button
				href="/demo-ui"
				variant="glass"
				class="border-2 border-white/30 bg-white/10 px-8 py-4 text-lg font-semibold text-white backdrop-blur hover:bg-white/20"
			>
				Explore Components
			</Button>
		</div>
	</div>
</section>
