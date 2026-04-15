<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		title: string;
		subtitle?: string;
		children: Snippet;
		footer?: Snippet;
	}

	let { title, subtitle, children, footer }: Props = $props();
</script>

<div
	class="min-h-screen flex items-center justify-center bg-surface-100-900 p-4 animate-in fade-in duration-500"
>
	<div
		class="card w-full max-w-md bg-surface-50-800 border border-surface-200-700 rounded-3xl shadow-xl p-6 md:p-10"
	>
		<div class="text-center mb-8">
			<h1
				class="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent"
			>
				{title}
			</h1>
			{#if subtitle}
				<p class="mt-2 text-sm text-surface-600-400">
					{subtitle}
				</p>
			{/if}
		</div>

		{@render children()}

		{#if footer}
			<div class="mt-6 pt-6 border-t border-surface-300-700">
				{@render footer()}
			</div>
		{/if}
	</div>
</div>
