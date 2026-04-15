<script lang="ts">
	import { page } from '$app/stores';
	import { authClient } from '$lib/auth-client';
	import ThemeToggle from '$lib/components/ui/ThemeToggle.svelte';

	interface Props {
		class?: string;
		session: ReturnType<typeof authClient.useSession>;
	}

	let { class: className = '', session }: Props = $props();

	const isLoggedIn = $derived(!$session.isPending && $session.data);
	const isAdmin = $derived($session.data?.user?.role === 'admin');
	const showLogout = $derived(
		$page.url.pathname === '/dashboard' || $page.url.pathname.startsWith('/admin')
	);
	const hideDashboardLink = $derived($page.url.pathname === '/dashboard');
</script>

<div class="flex items-center gap-2 {className}">
	{#if isLoggedIn}
		{#if isAdmin}
			<a href="/admin" class="btn-icon text-white hover:bg-white/10">
				<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>
			</a>
		{/if}

		{#if !hideDashboardLink}
			<a href="/dashboard" class="btn-icon text-white hover:bg-white/10">
				<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
			</a>
		{/if}

		{#if showLogout}
			<form action="/logout" method="POST" class="contents">
				<button type="submit" class="btn-icon text-white hover:bg-white/10 hover:text-error-300">
					<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
				</button>
			</form>
		{/if}

		<div class="w-px h-6 bg-white/10 mx-1"></div>
	{:else}
		<a href="/login" class="btn-icon text-white hover:bg-white/10 text-sm">Sign In</a>
		<a href="/signup" class="btn btn-sm preset-filled-primary-500">Sign Up</a>
	{/if}

	<ThemeToggle />
</div>
