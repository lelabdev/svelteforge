<script lang="ts">
	import './layout.css';
	import { Navbar } from '$lib/components/layout';
	import { Footer } from '$lib/components/layout';
	import { Toaster } from '$lib/components/svforge/ui/Toaster.svelte';

	let { children } = $props();
</script>

<Navbar links={[{ href: '/demo-ui', label: 'Components' }]} />

{@render children()}

<Toaster />
<Footer links={[{ href: '/demo-ui', label: 'Components' }]} />
