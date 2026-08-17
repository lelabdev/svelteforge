<script lang="ts">
let { data } = $props();
// Svelte 5: components are dynamic by default — a capitalized variable holds
// the MDsveX component and is rendered directly (`<Post />`). The transport
// hook in src/hooks.ts carries the component across the data boundary (slug
// on the wire, re-imported client-side).
const Post = $derived(data.post.content.component);
const date = new Date(data.post.date).toLocaleDateString('en', { year: 'numeric', month: 'long', day: 'numeric' });
</script>

<svelte:head>
<title>{data.post.title}</title>
<meta name="description" content={data.post.excerpt} />
</svelte:head>

<article class="max-w-prose mx-auto px-element py-section">
<a href="/blog" class="text-primary-500 mb-4 inline-block">← Back to blog</a>
<h1 class="text-4xl font-heading font-bold mb-4">{data.post.title}</h1>
<p class="text-surface-400 mb-section">{date}</p>
<Post />
</article>
