<script lang="ts">
	interface Props {
		class?: string;
		user?: { id: string; name?: string; email: string; role?: string; image?: string } | null;
		onMobileItemClick?: () => void;
	}

	let { class: className = '', user = null, onMobileItemClick }: Props = $props();

	const isLoggedIn = $derived(!!user);
	const isAdmin = $derived(user?.role === 'admin');

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
