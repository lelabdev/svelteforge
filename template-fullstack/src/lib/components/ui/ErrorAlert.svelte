<script lang="ts">
	import Icon from '$lib/components/icons/Icon.svelte';

	interface Props {
		title?: string;
		message: string;
		class?: string;
	}

	let { title = 'Error', message, class: className = '' }: Props = $props();
</script>

<div class="preset-tonal-error-500 flex items-start {className}" style="padding: var(--alert-p); border-radius: var(--radius-alert); gap: var(--gap-md)" role="alert">
	<Icon name="alertCircle" size={20} class="shrink-0" style="margin-top: var(--space-nano)" />
	<div>
		<p style="font-weight: var(--weight-subtitle)">{title}</p>
		<p style="font-size: var(--text-body); margin-top: var(--space-nano)">{message}</p>
	</div>
</div>
