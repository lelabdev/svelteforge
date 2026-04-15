<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { themeStore } from '$lib/utils/theme.svelte';
	import Icon from '$lib/components/icons/Icon.svelte';

	let mounted = $state(false);

	onMount(() => {
		themeStore.init();
		mounted = true;
	});

	onDestroy(() => {
		themeStore.destroy();
	});
</script>

{#if mounted}
	<button
		type="button"
		onclick={() => themeStore.toggle()}
		class="btn-icon hover:bg-surface-950 text-white transition-colors"
		aria-label={themeStore.isDark ? 'Switch to light mode' : 'Switch to dark mode'}
		title={themeStore.isDark ? 'Switch to light mode' : 'Switch to dark mode'}
	>
		{#if themeStore.isDark}
			<Icon name="moon" size={20} />
		{:else}
			<Icon name="sun" size={20} />
		{/if}
	</button>
{/if}
