<script lang="ts">
	import { page } from '$app/stores';
	import { authClient } from '$lib/auth-client';
	import ThemeToggle from '$lib/components/ui/ThemeToggle.svelte';
	import Icon from '$lib/components/icons/Icon.svelte';

	interface Props {
		class?: string;
		style?: string;
		session: ReturnType<typeof authClient.useSession>;
	}

	let { class: className = '', style: styleAttr, session }: Props = $props();

	const isLoggedIn = $derived(!$session.isPending && $session.data);
	const isAdmin = $derived($session.data?.user?.role === 'admin');
	const showLogout = $derived(
		$page.url.pathname === '/dashboard' || $page.url.pathname.startsWith('/admin')
	);
	const hideDashboardLink = $derived($page.url.pathname === '/dashboard');
</script>

<div class="flex items-center {className}" style="gap: var(--gap-sm); {styleAttr || ''}">
	{#if isLoggedIn}
		{#if isAdmin}
			<a href="/admin" class="btn-icon text-surface-50-950 hover:bg-surface-500-300/10" aria-label="Admin">
				<Icon name="shield" size={16} />
			</a>
		{/if}

		{#if !hideDashboardLink}
			<a href="/dashboard" class="btn-icon text-surface-50-950 hover:bg-surface-500-300/10" aria-label="Dashboard">
				<Icon name="user" size={16} />
			</a>
		{/if}

		{#if showLogout}
			<form action="/logout" method="POST" class="contents">
				<button type="submit" class="btn-icon text-surface-50-950 hover:bg-surface-500-300/10 hover:text-error-500" aria-label="Sign Out">
					<Icon name="logout" size={16} />
				</button>
			</form>
		{/if}

		<div class="w-px h-6 bg-surface-500-300/10 mx-1"></div>
	{:else}
		<a href="/login" class="btn-icon text-surface-50-950 hover:bg-surface-500-300/10 text-sm">Sign In</a>
		<a href="/signup" class="btn btn-sm preset-filled-primary-500">Sign Up</a>
	{/if}

	<ThemeToggle />
</div>
