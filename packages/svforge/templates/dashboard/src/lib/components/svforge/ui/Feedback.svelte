<script lang="ts">
	import { cn } from '$lib/utils/cn';
	import * as m from '$lib/paraglide/messages.js';
	import Check from 'phosphor-svelte/lib/Check';
	import Warning from 'phosphor-svelte/lib/Warning';
	import X from 'phosphor-svelte/lib/X';

	interface Props {
		type: 'success' | 'error';
		message: string;
		ondismiss?: () => void;
		class?: string;
	}

	let { type, message, ondismiss, class: className }: Props = $props();
</script>

{#if message}
	<div class={cn('flex items-center gap-2 rounded-container p-3', type === 'success' ? 'bg-success-100-900 text-success-700-300' : 'bg-error-100-900 text-error-300-700', className)}>
		{#if type === 'success'}<Check size={18} />{:else}<Warning size={18} />{/if}
		<span class="text-sm">{message}</span>
		{#if ondismiss}
			<button class="ml-auto" onclick={ondismiss} aria-label={m.common_dismiss()}><X size={14} /></button>
		{/if}
	</div>
{/if}
