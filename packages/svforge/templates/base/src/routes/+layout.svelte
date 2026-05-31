<script lang="ts">
	import './layout.css';
	import { Navbar } from '$lib/components/layout';
	import { Footer } from '$lib/components/layout';

	let { children } = $props();
</script>

<Navbar links={[{ href: '/demo-ui', label: 'Components' }]} />

{@render children()}

<Footer links={[{ href: '/demo-ui', label: 'Components' }]} />
