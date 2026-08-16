<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/svforge/primitives';

	let { data, form }: { data: ReturnType<typeof import('./$types').load>; form: any } = $props();
	const messages = $derived(data.messages);
	const conversationId = $derived(data.conversationId);
</script>

<svelte:head><title>{m.chat_conversation()} #{conversationId}</title></svelte:head>

<div class="max-w-container mx-auto px-element py-section space-y-section">
	<h1 class="text-3xl font-heading font-bold">{m.chat_conversation()} #{conversationId}</h1>

	{#if messages.length === 0}
		<p class="text-surface-500">{m.chat_empty()}</p>
	{:else}
		<ul class="space-y-2 rounded-card border border-surface-200-800 p-element">
			{#each [...messages].reverse() as msg (msg.id)}
				<li class="flex flex-col gap-0.5">
					<span class="text-xs text-surface-500">{msg.authorId} · {new Date(msg.createdAt).toLocaleString()}</span>
					<span class="text-sm">{msg.content}</span>
				</li>
			{/each}
		</ul>
	{/if}

	{#if form?.error}
		<p class="text-red-500 text-sm">{form.error}</p>
	{/if}

	<form method="POST" action="?/send" use:enhance class="flex gap-3 items-end">
		<label class="flex-1 flex flex-col gap-1 text-sm">
			{m.chat_message()}
			<textarea name="content" class="textarea" rows="2" required placeholder={m.chat_placeholder()}></textarea>
		</label>
		<Button type="submit">{m.chat_send()}</Button>
	</form>
</div>
