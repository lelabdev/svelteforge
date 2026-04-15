<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();
</script>

<div class="min-h-screen bg-surface-50 dark:bg-surface-900 flex">
	<!-- Admin Sidebar -->
	<aside class="hidden lg:flex w-64 bg-surface-100 dark:bg-surface-800 border-r border-surface-300 dark:border-surface-700 flex-col">
		<div class="p-4 border-b border-surface-300 dark:border-surface-700">
			<h2 class="text-lg font-bold">Admin</h2>
		</div>
		<nav class="flex-1 p-4 space-y-1">
			<a href="/admin" class="block px-3 py-2 rounded-lg hover:bg-surface-200 dark:hover:bg-surface-700 text-sm">
				Dashboard
			</a>
			<a href="/dashboard" class="block px-3 py-2 rounded-lg hover:bg-surface-200 dark:hover:bg-surface-700 text-sm">
				My Account
			</a>
		</nav>
	</aside>

	<!-- Main Content -->
	<div class="flex-1 space-y-4 sm:space-y-6 p-4 sm:p-6 overflow-auto">
		<div class="lg:hidden flex items-center gap-2 mb-4">
			<a href="/admin" class="text-lg font-bold">Admin</a>
			<span class="text-surface-400">|</span>
			<a href="/dashboard" class="text-sm text-surface-500 hover:underline">Dashboard</a>
		</div>

		{@render children()}
	</div>
</div>
