<script lang="ts">
	import { AppBar } from '@skeletonlabs/skeleton-svelte';
	import { authClient } from '$lib/auth-client';
	import AuthButtons from './auth-buttons.svelte';
	import { themeStore } from '$lib/utils/theme.svelte';
	import { onMount, onDestroy } from 'svelte';
	import MobileMenu from './mobile-menu.svelte';
	import Icon from '$lib/components/icons/Icon.svelte';
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
			<a href="/" class="text-surface-50-950 hover:text-primary-500-300 transition-colors" style="font-size: var(--text-logo); font-weight: var(--weight-title)">
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
				class="md:hidden btn-icon text-surface-50-950"
				aria-label="Menu"
			>
				{#if mobileMenuOpen}
					<Icon name="x" size={24} />
				{:else}
					<Icon name="menu" size={24} />
				{/if}
			</button>
		</AppBar.Trail>
	</AppBar.Toolbar>
</AppBar>
