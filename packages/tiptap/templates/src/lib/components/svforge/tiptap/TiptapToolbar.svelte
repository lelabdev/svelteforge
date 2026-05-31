<script lang="ts">
	interface Props {
		loading: boolean;
		isActive: (type: string, attrs?: Record<string, unknown>) => boolean;
		onToggleBold: () => void;
		onToggleItalic: () => void;
		onToggleGradient: () => void;
		onSetHeading: (level: 1 | 2 | 3) => void;
	}

	let { loading, isActive, onToggleBold, onToggleItalic, onToggleGradient, onSetHeading }: Props =
		$props();
</script>

<div class="flex flex-wrap gap-1 p-2 bg-surface-100-900 border-b border-surface-200-800 rounded-t-lg">
	{#if loading}
		<div class="flex items-center gap-2 px-3 py-1 text-sm text-surface-500">
			<div class="w-4 h-4 border-2 border-surface-300-700 border-t-primary-500 rounded-full animate-spin"></div>
			<span class="text-xs uppercase tracking-widest">Loading...</span>
		</div>
	{:else}
		<button
			type="button"
			onclick={onToggleBold}
			class="px-3 py-1.5 text-sm font-bold rounded transition-colors hover:bg-surface-200-800 {isActive('bold') ? 'bg-primary-500 text-white' : 'text-surface-700-300'}"
			aria-label="Bold"
			title="Bold"
		>B</button>

		<button
			type="button"
			onclick={onToggleItalic}
			class="px-3 py-1.5 text-sm italic rounded transition-colors hover:bg-surface-200-800 {isActive('italic') ? 'bg-primary-500 text-white' : 'text-surface-700-300'}"
			aria-label="Italic"
			title="Italic"
		>I</button>

		<div class="w-px bg-surface-200-800 mx-1 self-stretch"></div>

		<button
			type="button"
			onclick={onToggleGradient}
			class="px-3 py-1.5 text-sm font-bold rounded transition-colors hover:bg-surface-200-800 {isActive('gradient') ? 'bg-primary-500 text-white' : 'text-surface-700-300'}"
			aria-label="Gradient text"
			title="Gradient text"
		>
			<span class="bg-gradient-to-r from-primary-400 to-secondary-400 bg-clip-text text-transparent">G</span>
		</button>

		<div class="w-px bg-surface-200-800 mx-1 self-stretch"></div>

		{#each [1, 2, 3] as level (level)}
			<button
				type="button"
				onclick={() => onSetHeading(level as 1 | 2 | 3)}
				class="px-3 py-1.5 text-xs font-black rounded transition-colors hover:bg-surface-200-800 {isActive('heading', { level }) ? 'bg-primary-500 text-white' : 'text-surface-700-300'}"
				aria-label="Heading {level}"
				title="Heading {level}"
			>H{level}</button>
		{/each}
	{/if}
</div>
