<script lang="ts">
	const currentYear = new Date().getFullYear();
</script>

<footer
	class="bg-surface-50-950 border-t border-surface-200-800"
>
	<div class="mx-auto" style="max-width: var(--max-w-footer); padding: var(--footer-py) var(--footer-px)">
		<div class="flex flex-col md:flex-row justify-between items-center" style="gap: var(--gap-xl)">
			<div class="flex flex-col items-center md:items-start" style="gap: var(--gap-lg)">
				<a
					href="/"
					class="text-surface-900-100 hover:text-primary-600-400 transition-colors"
					style="font-size: var(--text-logo); font-weight: var(--weight-title)"
				>
					SvelteForge
				</a>
				<p class="text-surface-600-400 max-w-xs text-center md:text-left" style="font-size: var(--text-body)">
					A production-ready SvelteKit boilerplate with BetterAuth, Drizzle ORM, and Skeleton UI.
				</p>
			</div>

			<div class="flex flex-col items-center md:items-end" style="gap: var(--gap-lg)">
				<div
					class="text-surface-500 flex flex-col items-center md:items-end"
					style="font-size: var(--text-caption); gap: var(--gap-xs)"
				>
					<p>&copy; {currentYear} SvelteForge. All rights reserved.</p>
				</div>
			</div>
		</div>
	</div>
</footer>
