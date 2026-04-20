<script lang="ts">
	import Icon from '$lib/components/icons/Icon.svelte';

	type AlertVariant = 'error' | 'success' | 'warning' | 'info';

	interface Props {
		/** Alert variant determines icon, color preset, and ARIA role */
		variant?: AlertVariant;
		/** Bold title text (defaults to variant label) */
		title?: string;
		/** Body message */
		message: string;
		/** Additional CSS classes */
		class?: string;
	}

	let { variant = 'info', title, message, class: className = '' }: Props = $props();

	const variantConfig: Record<AlertVariant, { preset: string; icon: string; defaultTitle: string; role: string }> = {
		error: { preset: 'preset-tonal-error-500', icon: 'alertCircle', defaultTitle: 'Error', role: 'alert' },
		success: { preset: 'preset-tonal-success-500', icon: 'checkCircle', defaultTitle: 'Success', role: 'status' },
		warning: { preset: 'preset-tonal-warning-500', icon: 'alertTriangle', defaultTitle: 'Warning', role: 'alert' },
		info: { preset: 'preset-tonal-primary-500', icon: 'info', defaultTitle: 'Info', role: 'status' }
	};

	const config = $derived(variantConfig[variant]);
	const displayTitle = $derived(title ?? config.defaultTitle);
</script>

<div class="{config.preset} flex items-start {className}" style="padding: var(--alert-p); border-radius: var(--radius-alert); gap: var(--gap-md)" role={config.role}>
	<Icon name={config.icon} size={20} class="shrink-0" style="margin-top: var(--space-nano)" />
	<div>
		<p style="font-weight: var(--weight-subtitle)">{displayTitle}</p>
		<p style="font-size: var(--text-body); margin-top: var(--space-nano)">{message}</p>
	</div>
</div>
