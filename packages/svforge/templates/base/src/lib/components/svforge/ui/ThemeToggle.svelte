<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import Sun from 'phosphor-svelte/lib/Sun';
	import Moon from 'phosphor-svelte/lib/Moon';
	import { onMount } from 'svelte';
	import { followSystemTheme } from '$lib/utils/theme';

	interface Props {
		class?: string;
	}

	let { class: className = '' }: Props = $props();
	let isDark = $state(true);

	function applyMode(dark: boolean) {
		const mode = dark ? 'dark' : 'light';
		document.documentElement.setAttribute('data-mode', mode);
		document.documentElement.style.colorScheme = mode;
	}

	onMount(() => {
		const stored = localStorage.getItem('theme-mode');
		const media = window.matchMedia('(prefers-color-scheme: dark)');
		const followsSystem = stored !== 'dark' && stored !== 'light';
		isDark = stored === 'dark' || (followsSystem && media.matches);
		applyMode(isDark);

		return followSystemTheme(stored, media, (dark) => {
			isDark = dark;
			applyMode(isDark);
		});
	});

	function toggle() {
		isDark = !isDark;
		applyMode(isDark);
		localStorage.setItem('theme-mode', isDark ? 'dark' : 'light');
	}
</script>

<button
	onclick={toggle}
	class="btn hover:preset-tonal-surface p-2 {className}"
	aria-label={m.common_toggle_theme()}
>
	{#if isDark}
		<Moon size={18} />
	{:else}
		<Sun size={18} />
	{/if}
</button>
