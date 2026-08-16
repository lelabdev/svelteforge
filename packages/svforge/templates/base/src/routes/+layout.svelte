<script lang="ts">
	import './layout.css';
	import type { Pathname } from '$app/types';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { locales, localizeHref } from '$lib/paraglide/runtime';
	import * as m from '$lib/paraglide/messages.js';
	import { Navbar } from '$lib/components/svforge/layout';
	import { Footer } from '$lib/components/svforge/layout';

	let { children } = $props();
</script>

<Navbar links={[{ href: '/demo-ui', label: m.nav_components() }]} />

{@render children()}

<Footer links={[{ href: '/demo-ui', label: m.nav_components() }]} />

<div style="display:none">
	{#each locales as locale (locale)}
		<a href={resolve(localizeHref(page.url.pathname, { locale }) as Pathname)}>{locale}</a>
	{/each}
</div>
