<script lang="ts">
	import { page } from '$app/state';

	interface Props {
		title: string;
		description: string;
		image?: string;
		url?: string;
		type?: string;
	}

	let { title, description, image, url, type = 'website' }: Props = $props();

	const resolvedUrl = $derived(url ?? page.url.href);
	const twitterCard = $derived(image ? 'summary_large_image' : 'summary');
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:type" content={type} />
	<meta property="og:url" content={resolvedUrl} />
	{#if image}
		<meta property="og:image" content={image} />
	{/if}
	<meta name="twitter:card" content={twitterCard} />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
	{#if image}
		<meta name="twitter:image" content={image} />
	{/if}
</svelte:head>
