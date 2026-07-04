<script lang="ts">
import { Card, Badge } from '$lib/components/svforge/ui';
let { data } = $props();
</script>

<svelte:head><title>Blog</title></svelte:head>

<main class="max-w-container mx-auto px-element py-section">
<h1 class="text-4xl font-heading font-bold mb-section">Blog</h1>
<div class="grid grid-cols-1 md:grid-cols-2 gap-group">
{#each data.posts as post}
<a href="/blog/{post.slug}">
<Card variant="elevated" class="h-full">
<h2 class="text-xl font-heading font-bold mb-2">{post.title}</h2>
<p class="text-surface-500 mb-4">{post.excerpt}</p>
<div class="flex gap-2">
{#each post.tags as tag}
<Badge size="sm" variant="tonal">{tag}</Badge>
{/each}
</div>
<p class="text-sm text-surface-400 mt-4">{new Date(post.date).toLocaleDateString()}</p>
</Card>
</a>
{/each}
</div>
</main>
