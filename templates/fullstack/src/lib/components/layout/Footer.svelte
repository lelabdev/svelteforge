<script lang="ts">
	import { cn } from '$lib/utils/cn';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	interface Props extends HTMLAttributes<HTMLElement> {
		links?: { href: string; label: string }[];
		class?: string;
		children?: Snippet;
	}

	let { links = [], class: className, children, ...rest }: Props = $props();
</script>

<footer class={cn('border-t border-surface-200 dark:border-surface-800 bg-surface-100 dark:bg-surface-900', className)} {...rest}>
	<div class="max-w-container mx-auto px-element py-section">
		<div class="flex flex-col md:flex-row justify-between gap-group">
			{#if children}
				{@render children()}
			{/if}

			{#if links.length}
				<div class="flex flex-col gap-2">
					{#each links as link}
						<a href={link.href} class="text-sm hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
							{link.label}
						</a>
					{/each}
				</div>
			{/if}
		</div>

		<div class="mt-section pt-3 border-t border-surface-200 dark:border-surface-800 text-sm text-surface-500">
			&copy; {new Date().getFullYear()} SvelteForge. All rights reserved.
		</div>
	</div>
</footer>
