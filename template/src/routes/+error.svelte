<script lang="ts">
	import { page } from '$app/stores';
	import Icon from '$lib/components/icons/Icon.svelte';

	const status = $derived($page.status);
	const message = $derived($page.error?.message);

	const errorConfig = $derived(
		status === 404
			? {
					code: '404',
					title: 'Page Not Found',
					description: "The page you're looking for doesn't exist or has been moved.",
					icon: 'search',
					action: { label: 'Go Home', href: '/' }
				}
			: {
					code: status.toString(),
					title: 'Something Went Wrong',
					description: 'An unexpected error occurred. Please try again later.',
					icon: 'alertCircle',
					action: { label: 'Retry', href: $page.url.pathname }
				}
	);
</script>

<svelte:head>
	<title>{errorConfig.code} - {errorConfig.title}</title>
	<meta name="description" content={errorConfig.description} />
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-950 px-4 py-16">
	<div class="card p-8 sm:p-12 text-center max-w-lg">
		<div class="inline-flex items-center justify-center w-24 h-24 rounded-full bg-primary-500/10 dark:bg-primary-500/20 mb-8">
			<Icon name={errorConfig.icon} size={48} class="text-primary-500" />
		</div>

		<div class="space-y-4">
			<p class="text-8xl font-black text-primary-500/20">{errorConfig.code}</p>
			<h1 class="text-2xl sm:text-3xl font-bold">{errorConfig.title}</h1>
			<p class="text-surface-600 dark:text-surface-400 text-base">{errorConfig.description}</p>

			{#if status !== 404 && message}
				<div class="mt-6 p-4 bg-surface-50 dark:bg-surface-900/50 border border-surface-300 dark:border-surface-700 rounded-xl text-left">
					<p class="text-[10px] uppercase font-bold text-muted-foreground mb-1 tracking-wider">Error Details</p>
					<p class="text-xs font-mono text-error-500 break-all leading-relaxed">{message}</p>
				</div>
			{/if}
		</div>

		<div class="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
			<a href={errorConfig.action.href} class="btn btn-lg preset-filled-primary-500 px-8">
				{errorConfig.action.label}
			</a>
			<a href="/" class="btn btn-lg preset-outlined-primary-500 px-8">Go Home</a>
		</div>
	</div>
</div>
