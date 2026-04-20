<script lang="ts">
	import { Dialog, Portal } from '@skeletonlabs/skeleton-svelte';
	import type { Snippet } from 'svelte';
	import { cn } from '../utils/cn';

	type Side = 'left' | 'right' | 'top' | 'bottom';

	interface Props {
		/** Whether the sheet is visible. Two-way bindable. */
		open: boolean;
		/** Which edge the sheet slides in from. */
		side?: Side;
		/** Optional heading displayed in the sheet header. */
		title?: string;
		/** Additional CSS classes for the sheet panel. */
		class?: string;
		/** Sheet body content. */
		children: Snippet;
		/** Optional footer content rendered at the bottom. */
		footer?: Snippet;
	}

	let {
		open = $bindable(false),
		side = 'right',
		title,
		class: className = '',
		children,
		footer
	}: Props = $props();

	/**
	 * Per-side configuration: how the positioner aligns the panel and which
	 * translate axis/direction is used for the slide-in animation.
	 */
	const sideConfig = $derived.by(() => {
		const configs: Record<Side, { positioner: string; dimensions: string }> = {
			left: {
				positioner: 'flex justify-start',
				dimensions: 'h-full'
			},
			right: {
				positioner: 'flex justify-end',
				dimensions: 'h-full'
			},
			top: {
				positioner: 'flex flex-col items-start',
				dimensions: 'w-full'
			},
			bottom: {
				positioner: 'flex flex-col items-end justify-end',
				dimensions: 'w-full'
			}
		};
		return configs[side];
	});

	/** Animation classes driven by Dialog's data-state attribute. */
	const animBackdrop =
		'transition transition-discrete opacity-0 starting:data-[state=open]:opacity-0 data-[state=open]:opacity-100';

	const animContent = $derived.by(() => {
		const isHorizontal = side === 'left' || side === 'right';
		const isNegative = side === 'left' || side === 'top';

		const initial = isHorizontal
			? isNegative
				? '-translate-x-full'
				: 'translate-x-full'
			: isNegative
				? '-translate-y-full'
				: 'translate-y-full';

		const final = isHorizontal ? 'translate-x-0' : 'translate-y-0';

		return [
			'transition',
			'transition-discrete',
			'opacity-0',
			initial,
			`starting:data-[state=open]:opacity-0`,
			`starting:data-[state=open]:${initial}`,
			`data-[state=open]:opacity-100`,
			`data-[state=open]:${final}`
		].join(' ');
	});

	const panelClass = $derived(
		cn(
			'sheet-panel card bg-surface-50-950 shadow-xl overflow-y-auto',
			sideConfig.dimensions,
			animContent,
			className
		)
	);

	function handleClose() {
		open = false;
	}
</script>

<Dialog {open} onOpenChange={(e) => { open = e.open; }}>
	<Portal>
		<Dialog.Backdrop
			class="fixed inset-0 z-50 bg-surface-50-950/50 {animBackdrop}"
		/>
		<Dialog.Positioner class="fixed inset-0 z-50 {sideConfig.positioner}">
			<Dialog.Content class={panelClass}>
				{#if title}
					<div class="sheet-header border-b border-surface-200-700 flex items-center justify-between">
						<Dialog.Title class="sheet-title">{title}</Dialog.Title>
						<Dialog.CloseTrigger
							class="btn-icon hover:bg-surface-200-700"
							aria-label="Close panel"
						>
							&#x2715;
						</Dialog.CloseTrigger>
					</div>
				{:else}
					<div class="sheet-header-no-title flex justify-end">
						<Dialog.CloseTrigger
							class="btn-icon hover:bg-surface-200-700"
							aria-label="Close panel"
						>
							&#x2715;
						</Dialog.CloseTrigger>
					</div>
				{/if}

				<div class="sheet-body">
					{@render children()}
				</div>

				{#if footer}
					<div class="sheet-footer border-t border-surface-200-700">
						{@render footer()}
					</div>
				{/if}
			</Dialog.Content>
		</Dialog.Positioner>
	</Portal>
</Dialog>

<style>
	:global(.sheet-panel) {
		width: min(100vw, 24rem);
	}

	:global(.flex-col) > :global(.sheet-panel) {
		width: 100vw;
		height: auto;
		max-height: 80vh;
	}

	.sheet-header {
		padding: var(--modal-header-py) var(--modal-header-px);
	}

	.sheet-header-no-title {
		padding: var(--modal-header-py) var(--modal-header-px);
	}

	:global(.sheet-title) {
		font-size: var(--text-modal-title);
		font-weight: var(--weight-title);
	}

	.sheet-body {
		padding: var(--modal-body-p);
	}

	.sheet-footer {
		padding: var(--modal-header-py) var(--modal-header-px);
	}
</style>
