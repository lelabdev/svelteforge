<script lang="ts">
	import { cn } from '$lib/components/ui/utils/cn';

	const { class: className = '' }: { class?: string } = $props();
</script>

<span class={cn('logo text-4xl font-extrabold', className)}>SvelteForge</span>

<style>
	@keyframes metalFlow {
		0% {
			background-position: 0% 50%;
		}
		50% {
			background-position: 100% 50%;
		}
		100% {
			background-position: 0% 50%;
		}
	}
	.logo {
		font-family: 'Nunito Variable', sans-serif;
		color: transparent;
		background: linear-gradient(
			45deg,
			var(--color-secondary-200-800),
			var(--color-secondary-500),
			var(--color-secondary-600-400),
			var(--color-secondary-200-800)
		);
		background-size: 200% 200%;
		-webkit-background-clip: text;
		background-clip: text;
		letter-spacing: 0.05em;
		animation: metalFlow 5s ease-in-out infinite;
		filter: drop-shadow(0 0 2px var(--color-error-200-800));
	}
</style>
