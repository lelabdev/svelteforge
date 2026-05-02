<script lang="ts">
	import { AppBar } from '@skeletonlabs/skeleton-svelte';
	import ThemeToggle from '$lib/components/ui/ThemeToggle.svelte';
	import { themeStore } from '$lib/utils/theme.svelte';
	import { onMount, onDestroy } from 'svelte';

	let mobileMenuOpen = $state(false);

	onMount(() => {
		themeStore.init();
	});
	onDestroy(() => {
		themeStore.destroy();
	});
</script>

{#if mobileMenuOpen}
	<div
		class="md:hidden fixed inset-0 top-16 bg-surface-50-900 z-40"
		onclick={() => (mobileMenuOpen = false)}
		onkeydown={(e) => e.key === 'Escape' && (mobileMenuOpen = false)}
		role="dialog"
		aria-modal="true"
		tabindex="-1"
	>
		<div class="flex flex-col p-6">
			<button
				type="button"
				onclick={() => {
					themeStore.toggle();
					mobileMenuOpen = false;
				}}
				class="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-surface-200-800 text-sm"
			>
				{themeStore.isDark ? 'Light Mode' : 'Dark Mode'}
			</button>
		</div>
	</div>
{/if}

<AppBar>
	<AppBar.Toolbar class="grid-cols-[1fr_auto_1fr]">
		<AppBar.Lead>
			<a
				href="/"
				class="text-xl font-bold text-surface-50-950 hover:text-primary-400-500 transition-colors"
			>
				__PROJECT_NAME__
			</a>
		</AppBar.Lead>

		<AppBar.Headline />

		<AppBar.Trail>
			<div class="hidden md:flex items-center gap-2">
				<ThemeToggle />
			</div>

			<button
				onclick={() => (mobileMenuOpen = !mobileMenuOpen)}
				class="md:hidden btn-icon text-surface-50-950"
				aria-label="Menu"
			>
				{#if mobileMenuOpen}
					<svg
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<path d="M18 6L6 18M6 6l12 12" />
					</svg>
				{:else}
					<svg
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<path d="M3 12h18M3 6h18M3 18h18" />
					</svg>
				{/if}
			</button>
		</AppBar.Trail>
	</AppBar.Toolbar>
</AppBar>
