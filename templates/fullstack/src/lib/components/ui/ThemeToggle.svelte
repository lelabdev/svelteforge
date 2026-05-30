<script lang="ts">
	import Sun from 'phosphor-svelte/lib/Sun';
	import Moon from 'phosphor-svelte/lib/Moon';

	interface Props {
		class?: string;
	}

	let { class: className }: Props = $props();

	function toggle() {
		const html = document.documentElement;
		const isDark = html.classList.contains('dark');
		html.classList.toggle('dark', !isDark);
		localStorage.setItem('theme', isDark ? 'light' : 'dark');
	}
</script>

<button
	onclick={toggle}
	class="btn preset-ghost variant-surface p-2 rounded-full"
	aria-label="Toggle theme"
>
	<Sun size={18} class="dark:hidden" />
	<Moon size={18} class="hidden dark:block" />
</button>
