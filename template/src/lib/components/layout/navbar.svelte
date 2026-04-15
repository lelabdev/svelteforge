<script lang="ts">
	import { AppBar } from '@skeletonlabs/skeleton-svelte';
	import { authClient } from '$lib/auth-client';
	import AuthButtons from './auth-buttons.svelte';
	import { themeStore } from '$lib/utils/theme.svelte';
	import { onMount, onDestroy } from 'svelte';
	import MobileMenu from './mobile-menu.svelte';
	let mobileMenuOpen = $state(false);
	const session = authClient.useSession();

	onMount(() => {
		themeStore.init();
	});

	onDestroy(() => {
		themeStore.destroy();
	});

	function closeMobileMenu() {
		mobileMenuOpen = false;
	}
</script>

<MobileMenu {session} onClose={closeMobileMenu} open={mobileMenuOpen} />

<AppBar>
	<AppBar.Toolbar class="grid-cols-[1fr_auto_1fr]">
		<AppBar.Lead>
			<a href="/" class="text-white hover:text-primary-200 transition-colors" style="font-size: var(--text-logo); font-weight: var(--weight-title)">
				SvelteForge
			</a>
		</AppBar.Lead>

		<AppBar.Headline>
			<!-- Center: empty or breadcrumb -->
		</AppBar.Headline>

		<AppBar.Trail>
			<AuthButtons {session} class="hidden md:flex items-center" />

			<!-- Mobile menu toggle -->
			<button
				onclick={() => (mobileMenuOpen = !mobileMenuOpen)}
				class="md:hidden btn-icon text-white"
				aria-label="Menu"
			>
				{#if mobileMenuOpen}
					<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M18 6L6 18M6 6l12 12" />
					</svg>
				{:else}
					<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M3 12h18M3 6h18M3 18h18" />
					</svg>
				{/if}
			</button>
		</AppBar.Trail>
	</AppBar.Toolbar>
</AppBar>
