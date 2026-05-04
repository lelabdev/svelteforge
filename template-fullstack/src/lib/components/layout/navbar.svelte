<script lang="ts">
	import { AppBar } from '@skeletonlabs/skeleton-svelte';
	import AuthButtons from './auth-buttons.svelte';
	import { themeStore } from '$lib/utils/theme.svelte';
	import { onMount, onDestroy } from 'svelte';
	import MobileMenu from './mobile-menu.svelte';
	import Icon from '$lib/components/icons/Icon.svelte';

	interface Props {
		user?: { id: string; name?: string; email: string; role?: string; image?: string } | null;
	}

	let { user = null }: Props = $props();
	let mobileMenuOpen = $state(false);

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

<MobileMenu {user} onClose={closeMobileMenu} open={mobileMenuOpen} />

<AppBar>
	<AppBar.Toolbar class="grid-cols-[1fr_auto_1fr]">
		<AppBar.Lead>
			<a href="/" class="text-surface-50-950 hover:text-primary-400-500 transition-colors" style="font-size: var(--text-logo); font-weight: var(--weight-title)">
				SvelteForge
			</a>
		</AppBar.Lead>

		<AppBar.Headline>
			<!-- Center: empty or breadcrumb -->
		</AppBar.Headline>

		<AppBar.Trail>
			<AuthButtons {user} class="hidden md:flex items-center" />

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
