<script lang="ts">
	import { cn } from '$lib/utils/cn';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import ThemeToggle from '$lib/components/ui/ThemeToggle.svelte';
	import Menu from 'phosphor-svelte/lib/List';
	import X from 'phosphor-svelte/lib/X';

	interface Props extends HTMLAttributes<HTMLElement> {
		brand?: Snippet;
		links?: { href: string; label: string }[];
		class?: string;
	}

	let { brand, links = [], class: className, ...rest }: Props = $props();
	let mobileOpen = $state(false);
</script>

<nav class={cn('sticky top-0 z-50 bg-surface-50-950/80 backdrop-blur-md border-b border-surface-200-800', className)} {...rest}>
	<div class="max-w-container mx-auto flex items-center justify-between px-element py-3">
		<!-- Brand -->
		<a href="/" class="text-xl font-heading font-bold text-primary-500">
			{#if brand}
				{@render brand()}
			{:else}
				SvelteForge
			{/if}
		</a>

		<!-- Desktop links -->
		<div class="hidden md:flex items-center gap-4">
			{#each links as link}
				<a href={link.href} class="hover:text-primary-500 transition-colors">
					{link.label}
				</a>
			{/each}
			<ThemeToggle />
		</div>

		<!-- Mobile toggle -->
		<button
			class="md:hidden btn hover:preset-tonal-surface p-2 rounded-full"
			onclick={() => (mobileOpen = !mobileOpen)}
			aria-label="Toggle menu"
		>
			{#if mobileOpen}
				<X size={20} />
			{:else}
				<Menu size={20} />
			{/if}
		</button>
	</div>

	<!-- Mobile menu -->
	{#if mobileOpen}
		<div class="md:hidden border-t border-surface-200-800 px-element py-3 flex flex-col gap-3">
			{#each links as link}
				<a href={link.href} class="hover:text-primary-500 transition-colors" onclick={() => (mobileOpen = false)}>
					{link.label}
				</a>
			{/each}
			<ThemeToggle />
		</div>
	{/if}
</nav>
