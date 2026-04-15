<script lang="ts">
	const currentYear = new Date().getFullYear();
</script>

<footer
	class="bg-surface-50 dark:bg-surface-950 border-t border-surface-200 dark:border-surface-800"
>
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
		<div class="flex flex-col md:flex-row justify-between items-center gap-8">
			<div class="flex flex-col items-center md:items-start gap-4">
				<a
					href="/"
					class="text-xl font-bold text-surface-900 dark:text-surface-100 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
				>
					SvelteForge
				</a>
				<p class="text-surface-600 dark:text-surface-400 text-sm max-w-xs text-center md:text-left">
					A production-ready SvelteKit boilerplate with BetterAuth, Drizzle ORM, and Skeleton UI.
				</p>
			</div>

			<div class="flex flex-col items-center md:items-end gap-4">
				<div
					class="text-surface-500 dark:text-surface-500 text-xs flex flex-col items-center md:items-end gap-1"
				>
					<p>&copy; {currentYear} SvelteForge. All rights reserved.</p>
				</div>
			</div>
		</div>
	</div>
</footer>
