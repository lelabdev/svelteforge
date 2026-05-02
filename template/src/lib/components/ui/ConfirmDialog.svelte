<script lang="ts">
	import { Dialog, Portal } from '@skeletonlabs/skeleton-svelte';

	interface Props {
		open: boolean;
		title: string;
		message: string;
		confirmLabel?: string;
		cancelLabel?: string;
		variant?: 'danger' | 'warning' | 'primary';
		onConfirm: () => void;
		onCancel: () => void;
	}

	let {
		open,
		title,
		message,
		confirmLabel = 'Confirm',
		cancelLabel = 'Cancel',
		variant = 'danger',
		onConfirm,
		onCancel
	}: Props = $props();

	const variantClasses: Record<string, string> = {
		danger: 'preset-filled-error-500',
		warning: 'preset-filled-warning-500',
		primary: 'preset-filled-primary-500'
	};
</script>

<Dialog open={open} onOpenChange={(e) => { if (!e.open) onCancel(); }}>
	<Portal>
		<Dialog.Backdrop class="bg-black/50" />
		<Dialog.Positioner>
			<Dialog.Content class="card shadow-xl" style="max-width: var(--max-w-dialog); padding: var(--dialog-p)">
				<Dialog.Title style="font-size: var(--text-dialog-title); font-weight: var(--weight-subtitle); margin-bottom: var(--space-element)">{title}</Dialog.Title>
				<p class="text-surface-600-400" style="margin-bottom: var(--space-group)">{message}</p>
				<div class="flex justify-end" style="gap: var(--gap-md)">
					<button class="btn preset-outlined-secondary-500" onclick={onCancel}>{cancelLabel}</button>
					<button class="btn {variantClasses[variant]}" onclick={onConfirm}>{confirmLabel}</button>
				</div>
			</Dialog.Content>
		</Dialog.Positioner>
	</Portal>
</Dialog>
