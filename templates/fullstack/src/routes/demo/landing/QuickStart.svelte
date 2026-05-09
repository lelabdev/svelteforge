<script lang="ts">
	import CodeBlock from '$lib/components/codeBlock/CodeBlock.svelte';
	import { Badge, Card } from '$lib/components/ui';

	const code = `# Create your project
bunx create-svelteforge my-project
cd my-project

# That's it. Auth, DB, components — everything is wired.
# Open http://localhost:5173 and start building. 🚀`;
</script>

<section class="bg-surface-100-900 px-6 py-20">
	<div class="mx-auto max-w-5xl">
		<div class="mb-12 text-center">
			<h2 class="title mb-4 text-4xl font-bold text-surface-950-50">How it works</h2>
			<p class="subtitle text-xl text-surface-600-400">Three steps. Not thirty.</p>
		</div>

		<div class="mb-12 grid gap-8 sm:grid-cols-3">
			<div class="text-center">
				<div
					class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-500 text-xl font-bold text-white"
				>
					1
				</div>
				<h3 class="title mb-2 text-xl font-semibold text-surface-950-50">Create</h3>
				<p class="subtitle text-surface-600-400">One CLI command. Choose Landing or Full Stack.</p>
			</div>
			<div class="text-center">
				<div
					class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-500 text-xl font-bold text-white"
				>
					2
				</div>
				<h3 class="title mb-2 text-xl font-semibold text-surface-950-50">Configure</h3>
				<p class="subtitle text-surface-600-400">
					Setup script generates .env, DB, admin. Zero files to edit.
				</p>
			</div>
			<div class="text-center">
				<div
					class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-500 text-xl font-bold text-white"
				>
					3
				</div>
				<h3 class="title mb-2 text-xl font-semibold text-surface-950-50">Ship</h3>
				<p class="subtitle text-surface-600-400">
					Everything wired. Start coding what makes your project unique.
				</p>
			</div>
		</div>

		<Card variant="flat" class="bg-surface-800-900 p-0" noPadding>
			<div class="p-8">
				<CodeBlock lang="bash" {code} />
			</div>
		</Card>

		<div class="mt-12 text-center">
			<p class="subtitle mb-6 text-lg text-surface-600-400">Choose your template:</p>
			<div class="flex flex-wrap justify-center gap-3">
				<Badge variant="primary">Full Stack — Auth, DB, 40+ components</Badge>
				<Badge variant="surface">Landing — Minimal, UI only</Badge>
			</div>
		</div>
	</div>
</section>
