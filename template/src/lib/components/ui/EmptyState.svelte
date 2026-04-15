<script lang="ts">
	import { cn } from './utils/cn';
	import Icon from '$lib/components/icons/Icon.svelte';
	import type { Snippet } from 'svelte';

	interface Props {
		icon?: string;
		title: string;
		description?: string;
		class?: string;
		action?: Snippet;
	}

	let {
		icon = 'inbox',
		title,
		description,
		class: className = '',
		action
	}: Props = $props();
</script>

<div
	class={cn(
		'flex flex-col items-center justify-center text-center',
		className
	)}
	style="gap: var(--gap-lg); padding: var(--gap-xl)"
>
	<Icon name={icon} size={48} class="text-surface-400-500" />

	<h3
		class="text-surface-700-300"
		style="font-size: var(--text-card-title); font-weight: var(--weight-title)"
	>
		{title}
	</h3>

	{#if description}
		<p class="text-surface-600-400" style="font-size: var(--text-body); max-width: 24rem">
			{description}
		</p>
	{/if}

	{#if action}
		<div>
			{@render action()}
		</div>
	{/if}
</div>
