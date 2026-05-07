<script lang="ts">
	import { page } from '$app/state';
	import Icon from '$lib/components/icons/Icon.svelte';
	import Avatar from '$lib/components/ui/Avatar.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Divider from '$lib/components/ui/Divider.svelte';
	import Sheet from '$lib/components/ui/Sheet.svelte';
	import Tooltip from '$lib/components/ui/Tooltip.svelte';
	import { cn } from '$lib/components/ui/utils/cn';

	interface NavItem {
		label: string;
		href: string;
		icon: string;
	}

	interface Props {
		user: {
			id: string;
			name?: string;
			email: string;
			image?: string | null;
			role?: string | null;
		};
	}

	let { user }: Props = $props();
	let collapsed = $state(false);
	let mobileOpen = $state(false);

	const navItems: NavItem[] = [
		{ label: 'Dashboard', href: '/admin', icon: 'layoutDashboard' },
		{ label: 'Users', href: '/admin/users', icon: 'users' },
		{ label: 'Settings', href: '/admin/settings', icon: 'settings' }
	];

	function isActive(href: string): boolean {
		if (href === '/admin') {
			return page.url.pathname === '/admin';
		}
		return page.url.pathname.startsWith(href);
	}

	function closeMobile() {
		mobileOpen = false;
	}

	const displayName = $derived(user.name ?? user.email);
	const initials = $derived(
		(user.name ?? user.email)
			.split(' ')
			.map((part: string) => part[0])
			.slice(0, 2)
			.join('')
			.toUpperCase()
	);
</script>

<!-- Mobile sidebar (Sheet) -->
<div class="lg:hidden">
	<!-- Mobile top bar -->
	<div class="flex items-center justify-between p-4 bg-surface-100-900 border-b border-surface-200-700">
		<span class="font-bold text-primary-400-500" style="font-size: var(--text-logo)">Admin</span>
		<button
			onclick={() => (mobileOpen = true)}
			class="btn-icon text-surface-50-950"
			aria-label="Open admin menu"
		>
			<Icon name="menu" size={24} />
		</button>
	</div>

	<Sheet open={mobileOpen} side="left" title="Admin" class="bg-surface-100-900">
		<nav class="flex flex-col gap-1">
			{#each navItems as item}
				<a
					href={item.href}
					onclick={closeMobile}
					class={cn(
						'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
						isActive(item.href)
							? 'bg-primary-500/10 text-primary-700-300'
							: 'text-surface-600-400 hover:bg-surface-200-800 hover:text-surface-900-50'
					)}
				>
					<Icon name={item.icon} size={20} />
					<span>{item.label}</span>
				</a>
			{/each}
		</nav>

		<div class="mt-auto pt-4">
			<Divider />
			<div class="flex items-center gap-3 pt-4">
				<Avatar src={user.image} alt={displayName} size="sm" />
				<div class="flex flex-col min-w-0">
					<span class="text-sm font-medium text-surface-50-950 truncate">{displayName}</span>
					<span class="text-xs text-surface-500 truncate">{user.email}</span>
				</div>
			</div>
			<a
				href="/api/auth/sign-out"
				class="mt-3 flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-error-500 hover:bg-error-500/10 transition-colors"
			>
				<Icon name="logout" size={16} />
				<span>Sign out</span>
			</a>
		</div>
	</Sheet>
</div>

<!-- Desktop sidebar -->
<aside
	class={cn(
		'hidden lg:flex flex-col border-r border-surface-200-700 bg-surface-100-900 h-screen sticky top-0 shrink-0 transition-[width] duration-200',
		collapsed ? 'w-[4.5rem]' : 'w-60'
	)}
>
	<!-- Sidebar header -->
	<div class="flex items-center justify-between p-4 border-b border-surface-200-700">
		{#if !collapsed}
			<span class="font-bold text-primary-400-500 whitespace-nowrap" style="font-size: var(--text-logo)">
				Admin
			</span>
		{/if}
		<button
			onclick={() => (collapsed = !collapsed)}
			class={cn(
				'btn-icon text-surface-600-400 hover:text-surface-50-950 hover:bg-surface-200-800 transition-colors',
				!collapsed && 'ml-auto'
			)}
			aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
		>
			<Icon name={collapsed ? 'chevronRight' : 'chevronLeft'} size={18} />
		</button>
	</div>

	<!-- Navigation -->
	<nav class="flex-1 overflow-y-auto p-3 flex flex-col gap-1">
		{#each navItems as item}
			{#if collapsed}
				<Tooltip content={item.label} side="right">
					<a
						href={item.href}
						class={cn(
							'flex items-center justify-center rounded-lg p-2.5 transition-colors',
							isActive(item.href)
								? 'bg-primary-500/10 text-primary-700-300'
								: 'text-surface-600-400 hover:bg-surface-200-800 hover:text-surface-900-50'
						)}
					>
						<Icon name={item.icon} size={20} />
					</a>
				</Tooltip>
			{:else}
				<a
					href={item.href}
					class={cn(
						'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
						isActive(item.href)
							? 'bg-primary-500/10 text-primary-700-300'
							: 'text-surface-600-400 hover:bg-surface-200-800 hover:text-surface-900-50'
					)}
				>
					<Icon name={item.icon} size={20} />
					<span>{item.label}</span>
				</a>
			{/if}
		{/each}
	</nav>

	<!-- Bottom section: user info + logout -->
	<div class="border-t border-surface-200-700 p-3">
		{#if collapsed}
			<div class="flex flex-col items-center gap-2">
				<Tooltip content={displayName} side="right">
					<Avatar src={user.image} alt={displayName} size="sm" />
				</Tooltip>
				<Tooltip content="Sign out" side="right">
					<a
						href="/api/auth/sign-out"
						class="flex items-center justify-center rounded-lg p-2 text-error-500 hover:bg-error-500/10 transition-colors"
					>
						<Icon name="logout" size={16} />
					</a>
				</Tooltip>
			</div>
		{:else}
			<div class="flex items-center gap-3">
				<Avatar src={user.image} alt={displayName} size="sm" />
				<div class="flex flex-col min-w-0 flex-1">
					<span class="text-sm font-medium text-surface-50-950 truncate">{displayName}</span>
					<span class="text-xs text-surface-500 truncate">{user.email}</span>
				</div>
			</div>
			<a
				href="/api/auth/sign-out"
				class="mt-2 flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-error-500 hover:bg-error-500/10 transition-colors"
			>
				<Icon name="logout" size={16} />
				<span>Sign out</span>
			</a>
		{/if}
	</div>
</aside>
