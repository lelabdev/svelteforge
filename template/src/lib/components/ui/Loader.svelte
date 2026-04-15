<script lang="ts">
	interface Props {
		message?: string;
	}

	let { message = 'Loading...' }: Props = $props();
</script>

<div class="flex flex-col items-center justify-center gap-4 p-8">
	<div class="w-48 h-2 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
		<div class="h-full bg-primary-500 rounded-full animate-pulse"></div>
	</div>
	{#if message}
		<p class="text-sm text-surface-600 dark:text-surface-400">{message}</p>
	{/if}
</div>
