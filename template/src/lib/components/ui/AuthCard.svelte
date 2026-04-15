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
		class="card w-full authcard bg-surface-50-800 border border-surface-200-700 shadow-xl"
	>
		<div class="text-center auth-title-section">
			<h1
				class="auth-title bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent"
			>
				{title}
			</h1>
			{#if subtitle}
				<p class="auth-subtitle text-surface-600-400">
					{subtitle}
				</p>
			{/if}
		</div>

		{@render children()}

		{#if footer}
			<div class="auth-footer border-t border-surface-300-700">
				{@render footer()}
			</div>
		{/if}
	</div>
</div>

<style>
	.authcard {
		max-width: var(--max-w-authcard);
		border-radius: var(--radius-authcard);
		padding: var(--authcard-p);
	}
	@media (min-width: 768px) {
		.authcard {
			padding: var(--authcard-p-lg);
		}
	}

	.auth-title-section {
		margin-bottom: var(--space-section);
	}

	.auth-title {
		font-size: var(--text-auth-title);
		font-weight: var(--weight-title);
	}
	@media (min-width: 768px) {
		.auth-title {
			font-size: var(--text-auth-title-lg);
		}
	}

	.auth-subtitle {
		margin-top: var(--gap-sm);
		font-size: var(--text-body);
	}

	.auth-footer {
		margin-top: var(--space-group);
		padding-top: var(--space-group);
	}
</style>
