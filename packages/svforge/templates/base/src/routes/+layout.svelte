<script lang="ts">
	import './layout.css';
	import { Navbar } from '$lib/components/svforge/layout';
	import { Footer } from '$lib/components/svforge/layout';

	let { children } = $props();
</script>

<Navbar links={[{ href: '/demo-ui', label: 'Components' }]} />

{@render children()}

<Footer links={[{ href: '/demo-ui', label: 'Components' }]} />
