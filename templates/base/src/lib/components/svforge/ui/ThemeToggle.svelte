<script lang="ts">
	import Sun from 'phosphor-svelte/lib/Sun';
	import Moon from 'phosphor-svelte/lib/Moon';
	import { onMount } from 'svelte';

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
		if (stored) {
			// User has a manual preference
			isDark = stored === 'dark';
		} else {
			// Follow system
			isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
		}
		applyMode(isDark);
	});

	function toggle() {
		isDark = !isDark;
		applyMode(isDark);
		localStorage.setItem('theme-mode', isDark ? 'dark' : 'light');
	}
</script>

<button
	onclick={toggle}
	class="btn hover:preset-tonal-surface p-2 rounded-full {className}"
	aria-label="Toggle theme"
>
	{#if isDark}
		<Moon size={18} />
	{:else}
		<Sun size={18} />
	{/if}
</button>
