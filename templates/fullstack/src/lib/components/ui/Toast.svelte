<script lang="ts">
	import { getToasts, removeToast } from './toast-state.svelte';

	const kindPresets: Record<string, string> = {
		info: 'preset-tonal-primary-500',
		success: 'preset-tonal-success-500',
		warning: 'preset-tonal-warning-500',
		error: 'preset-tonal-error-500'
	};
</script>

{#if getToasts().length > 0}
	<div class="fixed bottom-4 right-4 z-50 flex flex-col" style="max-width: var(--max-w-toast); gap: var(--gap-md)">
		{#each getToasts() as toast (toast.id)}
			<div
				class="card {kindPresets[toast.kind] ?? kindPresets.info} shadow-lg flex items-start transition-all duration-300"
				style="padding: var(--toast-p); gap: var(--gap-md)"
			>
				<div class="flex-1 min-w-0">
					<p class="font-semibold" style="font-size: var(--text-body)">{toast.title}</p>
					{#if toast.description}
						<p class="mt-1 opacity-80" style="font-size: var(--text-caption)">{toast.description}</p>
					{/if}
				</div>
				<button
					type="button"
					onclick={() => removeToast(toast.id)}
					class="shrink-0 text-current opacity-50 hover:opacity-100 transition-opacity"
					aria-label="Close"
				>
					✕
				</button>
			</div>
		{/each}
	</div>
{/if}
