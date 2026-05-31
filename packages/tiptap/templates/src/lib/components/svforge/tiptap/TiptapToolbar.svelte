<script lang="ts">
	interface Props {
		loading: boolean;
		isActive: (type: string, attrs?: Record<string, unknown>) => boolean;
		onToggleBold: () => void;
		onToggleItalic: () => void;
		onToggleUnderline: () => void;
		onToggleStrike: () => void;
		onToggleBulletList: () => void;
		onToggleOrderedList: () => void;
		onToggleBlockquote: () => void;
		onToggleCode: () => void;
		onSetLink: () => void;
		onSetHeading: (level: 1 | 2 | 3) => void;
	}

	let {
		loading,
		isActive,
		onToggleBold,
		onToggleItalic,
		onToggleUnderline,
		onToggleStrike,
		onToggleBulletList,
		onToggleOrderedList,
		onToggleBlockquote,
		onToggleCode,
		onSetLink,
		onSetHeading
	}: Props = $props();

	type Btn = { label: string; title: string; action: () => void; check: string; checkAttrs?: Record<string, unknown> };

	const formatBtns: Btn[] = [
		{ label: 'B', title: 'Bold', action: onToggleBold, check: 'bold' },
		{ label: 'I', title: 'Italic', action: onToggleItalic, check: 'italic' },
		{ label: 'U', title: 'Underline', action: onToggleUnderline, check: 'underline' },
		{ label: 'S', title: 'Strikethrough', action: onToggleStrike, check: 'strike' },
	];

	const blockBtns: Btn[] = [
		{ label: '❝', title: 'Blockquote', action: onToggleBlockquote, check: 'blockquote' },
		{ label: '</>', title: 'Code block', action: onToggleCode, check: 'codeBlock' },
	];

	const listBtns: Btn[] = [
		{ label: '• List', title: 'Bullet list', action: onToggleBulletList, check: 'bulletList' },
		{ label: '1. List', title: 'Ordered list', action: onToggleOrderedList, check: 'orderedList' },
	];
</script>

<div class="flex flex-wrap items-center gap-1 p-2 bg-surface-100-900 border-b border-surface-200-800 rounded-t-lg">
	{#if loading}
		<div class="flex items-center gap-2 px-3 py-1 text-sm text-surface-500">
			<div class="w-4 h-4 border-2 border-surface-300-700 border-t-primary-500 rounded-full animate-spin"></div>
			<span class="text-xs uppercase tracking-widest">Loading...</span>
		</div>
	{:else}
		<!-- Format -->
		{#each formatBtns as btn}
			<button
				type="button"
				onclick={btn.action}
				class="px-2.5 py-1.5 text-sm rounded transition-colors hover:bg-surface-200-800 {isActive(btn.check) ? 'bg-primary-500 text-white' : 'text-surface-700-300'}"
				aria-label={btn.title}
				title={btn.title}
			>{btn.label}</button>
		{/each}

		<div class="w-px bg-surface-200-800 mx-1 self-stretch"></div>

		<!-- Headings -->
		{#each [1, 2, 3] as level (level)}
			<button
				type="button"
				onclick={() => onSetHeading(level as 1 | 2 | 3)}
				class="px-2.5 py-1.5 text-xs font-bold rounded transition-colors hover:bg-surface-200-800 {isActive('heading', { level }) ? 'bg-primary-500 text-white' : 'text-surface-700-300'}"
				aria-label="Heading {level}"
				title="Heading {level}"
			>H{level}</button>
		{/each}

		<div class="w-px bg-surface-200-800 mx-1 self-stretch"></div>

		<!-- Lists -->
		{#each listBtns as btn}
			<button
				type="button"
				onclick={btn.action}
				class="px-2.5 py-1.5 text-xs rounded transition-colors hover:bg-surface-200-800 {isActive(btn.check) ? 'bg-primary-500 text-white' : 'text-surface-700-300'}"
				aria-label={btn.title}
				title={btn.title}
			>{btn.label}</button>
		{/each}

		<div class="w-px bg-surface-200-800 mx-1 self-stretch"></div>

		<!-- Blocks -->
		{#each blockBtns as btn}
			<button
				type="button"
				onclick={btn.action}
				class="px-2.5 py-1.5 text-xs rounded transition-colors hover:bg-surface-200-800 {isActive(btn.check) ? 'bg-primary-500 text-white' : 'text-surface-700-300'}"
				aria-label={btn.title}
				title={btn.title}
			>{btn.label}</button>
		{/each}

		<div class="w-px bg-surface-200-800 mx-1 self-stretch"></div>

		<!-- Link -->
		<button
			type="button"
			onclick={onSetLink}
			class="px-2.5 py-1.5 text-xs rounded transition-colors hover:bg-surface-200-800 {isActive('link') ? 'bg-primary-500 text-white' : 'text-surface-700-300'}"
			aria-label="Link"
			title="Insert link"
		>🔗</button>
	{/if}
</div>
