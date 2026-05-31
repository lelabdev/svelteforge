<script lang="ts">
	import {
		Accordion, Alert, Avatar, Badge, Breadcrumb, Button, Card,
		Checkbox, Input, Select, Table, Tabs, Textarea, ThemeToggle, Toggle
	} from '$lib/components/svforge/ui';
	import { toaster } from '$lib/components/svforge/ui';
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

	<!-- Avatar -->
	<section class="space-y-4">
		<h2 class="text-2xl font-heading border-b border-surface-200-800 pb-2">Avatar</h2>
		<div class="flex items-center gap-3">
			<Avatar size="sm" src="https://api.dicebear.com/9.x/avataaars/svg?seed=1" alt="User 1" />
			<Avatar size="md" src="https://api.dicebear.com/9.x/avataaars/svg?seed=2" alt="User 2" />
			<Avatar size="lg" src="https://api.dicebear.com/9.x/avataaars/svg?seed=3" alt="User 3" />
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

	<!-- Accordion -->
	<section class="space-y-4">
		<h2 class="text-2xl font-heading border-b border-surface-200-800 pb-2">Accordion</h2>
		<Accordion items={[
			{ title: 'What is SvelteForge?', content: 'A SvelteKit starter kit built on Skeleton UI.' },
			{ title: 'Is it open source?', content: 'Yes, fully open source on GitHub.' },
			{ title: 'Can I customize the theme?', content: 'Absolutely. All colors and spacing use CSS variables.' }
		]} />
	</section>

	<!-- Tabs -->
	<section class="space-y-4">
		<h2 class="text-2xl font-heading border-b border-surface-200-800 pb-2">Tabs</h2>
		<Tabs tabs={[
			{ label: 'Overview', content: 'This is the overview tab with general information.' },
			{ label: 'Features', content: 'A list of features and capabilities.' },
			{ label: 'Pricing', content: 'Free and open source. No pricing page needed!' }
		]} />
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

	<!-- Breadcrumb -->
	<section class="space-y-4">
		<h2 class="text-2xl font-heading border-b border-surface-200-800 pb-2">Breadcrumb</h2>
		<Breadcrumb items={[
			{ href: '/', label: 'Home' },
			{ href: '/demo-ui', label: 'Components' },
			{ label: 'Breadcrumb' }
		]} />
	</section>

	<!-- Theme -->
	<section class="space-y-4">
		<h2 class="text-2xl font-heading border-b border-surface-200-800 pb-2">Theme</h2>
		<p class="text-surface-500">Click to toggle light/dark mode:</p>
		<ThemeToggle />
	</section>

	<!-- Toast -->
	<section class="space-y-4">
		<h2 class="text-2xl font-heading border-b border-surface-200-800 pb-2">Toast</h2>
		<div class="flex flex-wrap gap-3">
			<Button onclick={() => toaster.success({ title: 'Saved!', description: 'Your changes have been saved.' })}>Success</Button>
			<Button color="error" onclick={() => toaster.error({ title: 'Error', description: 'Something went wrong.' })}>Error</Button>
			<Button color="warning" onclick={() => toaster.warning({ title: 'Warning', description: 'Check your input.' })}>Warning</Button>
			<Button color="secondary" onclick={() => toaster.info({ title: 'Info', description: 'Here is some info.' })}>Info</Button>
		</div>
	</section>
</main>

<Footer links={[{ href: '/demo-ui', label: 'Components' }]} />
