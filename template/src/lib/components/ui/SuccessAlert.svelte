<script lang="ts">
	import Icon from '$lib/components/icons/Icon.svelte';

	interface Props {
		title?: string;
		message: string;
		class?: string;
	}

	let { title = 'Success', message, class: className = '' }: Props = $props();
</script>

<div class="preset-tonal-success-500 p-4 rounded-xl flex items-start gap-3 {className}" role="status">
	<Icon name="checkCircle" size={20} class="shrink-0 mt-0.5" />
	<div>
		<p class="font-semibold">{title}</p>
		<p class="text-sm mt-0.5">{message}</p>
	</div>
</div>
