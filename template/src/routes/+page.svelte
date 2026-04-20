<script lang="ts">
	import { Button } from '$lib/components/ui';
</script>

<svelte:head>
	<title>Welcome</title>
	<meta name="description" content="Welcome" />
</svelte:head>

<main class="min-h-screen flex items-center justify-center bg-surface-50-950">
	<div class="max-w-lg mx-auto px-4 text-center space-y-8">
		<div>
			<h1 class="text-4xl sm:text-5xl font-black uppercase tracking-tight">
				Welcome
			</h1>
			<p class="text-lg text-surface-500 mt-4">
				Sign in to access your dashboard.
			</p>
		</div>

		<div class="flex flex-col sm:flex-row gap-3 justify-center">
			<Button href="/login" variant="primary" size="lg">Sign In</Button>
			<Button href="/signup" variant="outline" size="lg">Create Account</Button>
		</div>
	</div>
</main>
