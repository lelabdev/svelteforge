<script lang="ts">
	import { AppBar } from '@skeletonlabs/skeleton-svelte';
	import AuthButtons from './auth-buttons.svelte';
	import { themeStore } from '$lib/utils/theme.svelte';
	import { onMount, onDestroy } from 'svelte';
	import MobileMenu from './mobile-menu.svelte';
	import Icon from '$lib/components/icons/Icon.svelte';
	import Sheet from '$lib/components/ui/Sheet.svelte';
	import NotificationBadge from '$lib/components/ui/NotificationBadge.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import {
		getNotifications,
		getUnreadCount,
		markAsRead,
		markAllRead,
		fetchNotifications,
		timeAgo
	} from '$lib/stores/notification-store.svelte';

	interface Props {
		user?: { id: string; name?: string; email: string; role?: string; image?: string } | null;
	}

	let { user = null }: Props = $props();
	let mobileMenuOpen = $state(false);
	let notifOpen = $state(false);

	// Initialize notifications on mount
	onMount(() => {
		themeStore.init();
		if (user) {
			fetchNotifications();
		}
	});

	onDestroy(() => {
		themeStore.destroy();
	});

	function closeMobileMenu() {
		mobileMenuOpen = false;
	}

	function handleMarkAllRead() {
		markAllRead();
	}

	function handleNotificationClick(id: string) {
		markAsRead(id);
	}
</script>

<MobileMenu {user} onClose={closeMobileMenu} open={mobileMenuOpen} />

<AppBar>
	<AppBar.Toolbar class="grid-cols-[1fr_auto_1fr]">
		<AppBar.Lead>
			<a href="/" class="text-primary-400-500 hover:text-primary-300-600 transition-colors font-bold" style="font-size: var(--text-logo); font-weight: var(--weight-title)">
				SvelteForge
			</a>
		</AppBar.Lead>

		<AppBar.Headline>
			<!-- Center: empty or breadcrumb -->
		</AppBar.Headline>

		<AppBar.Trail>
			<!-- Notification Bell (only for logged-in users) -->
			{#if user}
				<div class="relative">
					<button
						onclick={() => (notifOpen = !notifOpen)}
						class="btn-icon text-surface-50-950 hover:bg-surface-200-800 transition-colors relative"
						aria-label="Notifications"
					>
						<Icon name="bell" size={20} />
						{#if getUnreadCount() > 0}
							<NotificationBadge count={getUnreadCount()} />
						{/if}
					</button>
				</div>
			{/if}

			<AuthButtons {user} class="hidden md:flex items-center" />

			<!-- Mobile menu toggle -->
			<button
				onclick={() => (mobileMenuOpen = !mobileMenuOpen)}
				class="md:hidden btn-icon text-surface-50-950"
				aria-label="Menu"
			>
				{#if mobileMenuOpen}
					<Icon name="x" size={24} />
				{:else}
					<Icon name="menu" size={24} />
				{/if}
			</button>
		</AppBar.Trail>
	</AppBar.Toolbar>
</AppBar>

<!-- Notification Sheet -->
{#if user}
	<Sheet open={notifOpen} side="right" title="Notifications" class="bg-surface-50-950">
		<div class="flex flex-col gap-4">
			<!-- Actions -->
			{#if getUnreadCount() > 0}
				<div class="flex items-center justify-between">
					<span class="text-sm text-surface-500">
						{getUnreadCount()} unread
					</span>
					<button
						onclick={handleMarkAllRead}
						class="text-sm text-primary-500 hover:text-primary-600-400 transition-colors font-medium"
					>
						Mark all read
					</button>
				</div>
			{/if}

			<!-- Notification List -->
			{#if getNotifications().length === 0}
				<EmptyState
					icon="bell"
					title="No notifications"
					description="You're all caught up! New notifications will appear here."
				/>
			{:else}
				<div class="flex flex-col divide-y divide-surface-200-700">
					{#each getNotifications() as notif (notif.id)}
						<button
							class="flex flex-col gap-1 text-left w-full py-3 px-1 transition-colors hover:bg-surface-100-900 relative
								{!notif.read ? 'border-l-2 border-l-primary-500 pl-2' : 'pl-3'}"
							onclick={() => handleNotificationClick(notif.id)}
						>
							<div class="flex items-center justify-between gap-2">
								<span class="text-sm font-medium {notif.read ? 'text-surface-600-400' : 'text-surface-50-950'}">
									{notif.title}
								</span>
								{#if !notif.read}
									<span class="w-2 h-2 rounded-full bg-primary-500 shrink-0"></span>
								{/if}
							</div>
							<p class="text-xs text-surface-500 line-clamp-2">
								{notif.message}
							</p>
							<span class="text-xs text-surface-400-500 mt-0.5">
								{timeAgo(notif.createdAt)}
							</span>
						</button>
					{/each}
				</div>
			{/if}
		</div>
	</Sheet>
{/if}
