<script lang="ts">
	import { cn } from '$lib/utils/cn';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import Users from 'phosphor-svelte/lib/Users';
	import Gear from 'phosphor-svelte/lib/Gear';
	import ChartBar from 'phosphor-svelte/lib/ChartBar';
	import SignOut from 'phosphor-svelte/lib/SignOut';
	import Menu from 'phosphor-svelte/lib/List';
	import X from 'phosphor-svelte/lib/X';
	import ThemeToggle from '$lib/components/svforge/ui/ThemeToggle.svelte';

	type NavItem = { href: string; label: string; icon: typeof ChartBar };

	interface Props extends HTMLAttributes<HTMLElement> {
		items?: NavItem[];
		currentPath?: string;
		user?: { name: string; email: string } | null;
		onSignOut?: () => void;
		class?: string;
		children: Snippet;
	}

	let {
		items = [
			{ href: '/admin', label: 'Dashboard', icon: ChartBar },
			{ href: '/admin/users', label: 'Users', icon: Users },
			{ href: '/admin/settings', label: 'Settings', icon: Gear }
		],
		currentPath = '',
		user = null,
		onSignOut,
		class: className,
		children
	}: Props = $props();

	let collapsed = $state(false);
	let mobileOpen = $state(false);

	function navClass(href: string) {
		return cn(
			'flex items-center gap-3 px-3 py-2 rounded-card transition-colors',
			currentPath === href
				? 'bg-primary-100-900 text-primary-700-300'
				: 'hover:bg-surface-100-800 text-surface-600-400'
		);
	}
</script>

<div class={cn('flex min-h-screen', className)}>
	<!-- Desktop Sidebar -->
	<aside class="hidden lg:flex flex-col border-r border-surface-200-800 bg-surface-50-950 transition-all {collapsed ? 'w-16' : 'w-56'}">
		<div class="flex items-center justify-between p-3 border-b border-surface-200-800">
			{#if !collapsed}
				<a href="/admin" class="text-lg font-heading font-bold text-primary-600-400">Admin</a>
			{/if}
			<button
				class="btn preset-ghost variant-surface p-1 rounded"
				onclick={() => (collapsed = !collapsed)}
				aria-label="Toggle sidebar"
			>
				<Menu size={18} />
			</button>
		</div>

		<nav class="flex-1 p-2 space-y-1">
			{#each items as item}
				{@const Icon = item.icon}
				<a
					href={item.href}
					class={navClass(item.href)}
				>
					<Icon size={20} />
					{#if !collapsed}<span class="text-sm font-medium">{item.label}</span>{/if}
				</a>
			{/each}
		</nav>

		<div class="p-2 border-t border-surface-200-800">
			<ThemeToggle />
		</div>
	</aside>

	<!-- Main area -->
	<div class="flex-1 flex flex-col">
		<!-- Top bar -->
		<header class="sticky top-0 z-50 bg-surface-50-950/80 backdrop-blur-md border-b border-surface-200-800 px-element py-3 flex items-center justify-between">
			<div class="flex items-center gap-3">
				<button class="lg:hidden btn preset-ghost variant-surface p-2 rounded" onclick={() => (mobileOpen = !mobileOpen)} aria-label="Menu">
					{#if mobileOpen}<X size={20} />{:else}<Menu size={20} />{/if}
				</button>
				<h1 class="font-heading font-bold text-lg">Dashboard</h1>
			</div>
			<div class="flex items-center gap-3">
				<ThemeToggle class="lg:hidden" />
				{#if user}
					<span class="text-sm text-surface-500 hidden sm:block">{user.name}</span>
					{#if onSignOut}
						<button class="btn preset-ghost variant-surface p-2 rounded" onclick={onSignOut} aria-label="Sign out">
							<SignOut size={18} />
						</button>
					{/if}
				{/if}
			</div>
		</header>

		<!-- Mobile sidebar overlay -->
		{#if mobileOpen}
			<div class="lg:hidden fixed inset-0 z-40 bg-black/50" onclick={() => (mobileOpen = false)}>
				<aside class="w-56 h-full bg-surface-50-950 border-r border-surface-200-800 p-3 space-y-1" onclick={(e: Event) => e.stopPropagation()}>
					{#each items as item}
						{@const Icon = item.icon}
						<a
							href={item.href}
							class={navClass(item.href)}
							onclick={() => (mobileOpen = false)}
						>
							<Icon size={20} />
							<span class="text-sm font-medium">{item.label}</span>
						</a>
					{/each}
				</aside>
			</div>
		{/if}

		<!-- Content -->
		<main class="flex-1 p-group overflow-auto">
			{@render children()}
		</main>
	</div>
</div>
