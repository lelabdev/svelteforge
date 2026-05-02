<script lang="ts">
	import { authClient } from '$lib/auth-client';

	interface Props {
		class?: string;
		session: ReturnType<typeof authClient.useSession>;
		onMobileItemClick?: () => void;
	}

	let { class: className = '', session, onMobileItemClick }: Props = $props();

	const isLoggedIn = $derived(!$session.isPending && $session.data);
	const isAdmin = $derived(!$session.isPending && $session.data?.user?.role === 'admin');

	function handleNavClick() {
		onMobileItemClick?.();
	}
</script>

{#if isLoggedIn}
	{#if isAdmin}
		<a href="/admin" onclick={handleNavClick} class={className}>Admin</a>
		<a href="/dashboard" onclick={handleNavClick} class={className}>Dashboard</a>
	{:else}
		<a href="/dashboard" onclick={handleNavClick} class={className}>Dashboard</a>
	{/if}
{/if}
