<script lang="ts">
	import Sun from 'phosphor-svelte/lib/Sun';
	import Moon from 'phosphor-svelte/lib/Moon';
	import { onMount } from 'svelte';

	interface Props {
		class?: string;
	}

	let { class: className = '' }: Props = $props();

	let isDark = $state(true);

	onMount(() => {
		const stored = localStorage.getItem('theme-mode');
		if (stored === 'light') {
			isDark = false;
			document.documentElement.setAttribute('data-mode', 'light');
			document.documentElement.style.colorScheme = 'light';
		} else {
			isDark = true;
			document.documentElement.setAttribute('data-mode', 'dark');
			document.documentElement.style.colorScheme = 'dark';
		}
	});

	function toggle() {
		isDark = !isDark;
		const mode = isDark ? 'dark' : 'light';
		document.documentElement.setAttribute('data-mode', mode);
		document.documentElement.style.colorScheme = mode;
		if (mode === 'light') {
			localStorage.setItem('theme-mode', 'light');
		} else {
			localStorage.removeItem('theme-mode');
		}
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
