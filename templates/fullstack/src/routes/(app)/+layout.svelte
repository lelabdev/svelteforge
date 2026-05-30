<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import AdminLayout from '$lib/components/layout/AdminLayout.svelte';
	import { authClient } from '$lib/client/auth';

	let { data, children } = $props();

	async function handleSignOut() {
		await authClient.signOut();
		goto('/login');
	}
</script>

<AdminLayout currentPath={$page.url.pathname} user={data.user} onSignOut={handleSignOut}>
	{@render children()}
</AdminLayout>
