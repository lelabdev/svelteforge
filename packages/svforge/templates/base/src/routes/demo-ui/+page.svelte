<script lang="ts">
	import {
		Alert, Badge, Button, Card,
		Checkbox, Input, Select, Table, Textarea, ThemeToggle, Toggle
	} from '$lib/components/svforge/ui';
	import { Navbar } from '$lib/components/layout';
	import { Footer } from '$lib/components/layout';

	let loading = $state(false);

	function simulateLoading() {
		loading = true;
		setTimeout(() => (loading = false), 2000);
	}
</script>

<svelte:head>
	<title>SvelteForge — Component Demo</title>
</svelte:head>

<Navbar links={[{ href: '/demo-ui', label: 'Demo' }]} />

<main class="max-w-container mx-auto px-element py-section space-y-section">
	<h1 class="text-4xl font-heading font-bold">Component Demo</h1>
	<p class="text-surface-500">All SvelteForge components with variants. Theme changes apply instantly.</p>

	<!-- Buttons -->
	<section class="space-y-4">
		<h2 class="text-2xl font-heading border-b border-surface-200-800 pb-2">Button</h2>
		<h3 class="text-lg font-heading">Colors (Filled)</h3>
		<div class="flex flex-wrap gap-3">
			<Button>Primary</Button>
			<Button color="secondary">Secondary</Button>
			<Button color="tertiary">Tertiary</Button>
			<Button color="success">Success</Button>
			<Button color="warning">Warning</Button>
			<Button color="error">Error</Button>
			<Button color="surface">Surface</Button>
		</div>
		<h3 class="text-lg font-heading">Variants</h3>
		<div class="flex flex-wrap gap-3">
			<Button variant="filled">Filled</Button>
			<Button variant="outlined">Outlined</Button>
			<Button variant="tonal">Tonal</Button>
			<Button variant="ghost">Ghost</Button>
		</div>
		<h3 class="text-lg font-heading">Sizes</h3>
		<div class="flex flex-wrap gap-3 items-center">
			<Button size="sm">Small</Button>
			<Button size="md">Medium</Button>
			<Button size="lg">Large</Button>
		</div>
		<h3 class="text-lg font-heading">States</h3>
		<div class="flex flex-wrap gap-3">
			<Button loading={loading} onclick={simulateLoading}>
				{loading ? 'Loading...' : 'Click to Load'}
			</Button>
			<Button href="/">Link Button</Button>
			<Button disabled>Disabled</Button>
		</div>
	</section>

	<!-- Cards -->
	<section class="space-y-4">
		<h2 class="text-2xl font-heading border-b border-surface-200-800 pb-2">Card</h2>
		<div class="grid grid-cols-1 md:grid-cols-3 gap-group">
			<Card>
				<p>Flat card with some content.</p>
			</Card>
			<Card variant="elevated">
				<p>Elevated card with shadow.</p>
			</Card>
			<Card variant="outlined">
				<p>Outlined card with ring border.</p>
			</Card>
		</div>
		<Card>
			{#snippet header()}
				<h3 class="font-heading font-bold">Card with Header & Footer</h3>
			{/snippet}
			<p>Content goes here.</p>
			{#snippet footer()}
				<div class="flex justify-end gap-2">
					<Button variant="ghost" size="sm">Cancel</Button>
					<Button size="sm">Save</Button>
				</div>
			{/snippet}
		</Card>
	</section>

	<!-- Badges -->
	<section class="space-y-4">
		<h2 class="text-2xl font-heading border-b border-surface-200-800 pb-2">Badge</h2>
		<h3 class="text-lg font-heading">Filled</h3>
		<div class="flex flex-wrap gap-2">
			<Badge>Primary</Badge>
			<Badge color="secondary">Secondary</Badge>
			<Badge color="tertiary">Tertiary</Badge>
			<Badge color="success">Success</Badge>
			<Badge color="warning">Warning</Badge>
			<Badge color="error">Error</Badge>
			<Badge color="surface">Surface</Badge>
		</div>
		<h3 class="text-lg font-heading">Outlined</h3>
		<div class="flex flex-wrap gap-2">
			<Badge variant="outlined">Primary</Badge>
			<Badge variant="outlined" color="secondary">Secondary</Badge>
			<Badge variant="outlined" color="success">Success</Badge>
			<Badge variant="outlined" color="warning">Warning</Badge>
			<Badge variant="outlined" color="error">Error</Badge>
			<Badge variant="outlined" color="surface">Surface</Badge>
		</div>
		<h3 class="text-lg font-heading">Tonal</h3>
		<div class="flex flex-wrap gap-2">
			<Badge variant="tonal">Primary</Badge>
			<Badge variant="tonal" color="secondary">Secondary</Badge>
			<Badge variant="tonal" color="success">Success</Badge>
			<Badge variant="tonal" color="error">Error</Badge>
		</div>
		<h3 class="text-lg font-heading">Sizes</h3>
		<div class="flex flex-wrap gap-2 items-center">
			<Badge size="sm">Small</Badge>
			<Badge size="md">Medium</Badge>
			<Badge size="lg">Large</Badge>
		</div>
	</section>


	<!-- Alerts -->
	<section class="space-y-4">
		<h2 class="text-2xl font-heading border-b border-surface-200-800 pb-2">Alert</h2>
		<div class="space-y-3">
			<Alert variant="info">This is an informational message.</Alert>
			<Alert variant="success">Operation completed successfully!</Alert>
			<Alert variant="warning">Please review before continuing.</Alert>
			<Alert variant="error">Something went wrong. Please try again.</Alert>
		</div>
	</section>

	<!-- Form -->
	<section class="space-y-4">
		<h2 class="text-2xl font-heading border-b border-surface-200-800 pb-2">Form</h2>
		<Card>
			<div class="space-y-4">
				<Input label="Name" placeholder="Enter your name" />
				<Input label="Email" type="email" placeholder="you@example.com" error="Invalid email" />
				<Textarea label="Message" placeholder="Write something..." rows={3} />
				<Select
					label="Category"
					options={[
						{ value: '', label: 'Select...' },
						{ value: 'design', label: 'Design' },
						{ value: 'dev', label: 'Development' },
						{ value: 'marketing', label: 'Marketing' }
					]}
				/>
				<div class="flex flex-col gap-3">
					<Checkbox label="I agree to the terms" />
					<Toggle label="Enable notifications" />
				</div>
				<Button>Submit</Button>
			</div>
		</Card>
	</section>



	<!-- Table -->
	<section class="space-y-4">
		<h2 class="text-2xl font-heading border-b border-surface-200-800 pb-2">Table</h2>
		<Table
			columns={[
				{ key: 'name', label: 'Name' },
				{ key: 'role', label: 'Role' },
				{ key: 'status', label: 'Status' }
			]}
			rows={[
				{ name: 'Alice', role: 'Developer', status: 'Active' },
				{ name: 'Bob', role: 'Designer', status: 'Away' },
				{ name: 'Charlie', role: 'PM', status: 'Active' }
			]}
		/>
	</section>


	<!-- Richer components: Accordion, Tabs, Avatar, Breadcrumb etc. are NOT
	     re-implemented here — use the official ones from @skeletonlabs/skeleton-svelte
	     (they ship keyboard + ARIA support): -->
	<section class="space-y-4">
		<h2 class="text-2xl font-heading border-b border-surface-200-800 pb-2">Richer components</h2>
		<p class="text-surface-500">
			Accordion, Tabs, Avatar, Breadcrumb… are provided by
			<code class="text-primary-600-400">@skeletonlabs/skeleton-svelte</code> —
			<code>import {{ Accordion, Tabs, Avatar }} from '@skeletonlabs/skeleton-svelte';</code>
		</p>
	</section>

	<!-- Theme -->
	<section class="space-y-4">
		<h2 class="text-2xl font-heading border-b border-surface-200-800 pb-2">Theme</h2>
		<p class="text-surface-500">Click to toggle light/dark mode:</p>
		<ThemeToggle />
	</section>
</main>

<Footer links={[{ href: '/demo-ui', label: 'Components' }]} />
