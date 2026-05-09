<script module>
	import { createHighlighterCoreSync } from 'shiki/core';
	import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';
	// Themes
	import ayuDark from 'shiki/themes/ayu-dark.mjs';
	// Languages
	import bash from 'shiki/langs/bash.mjs';
	import console from 'shiki/langs/console.mjs';
	import css from 'shiki/langs/css.mjs';
	import html from 'shiki/langs/html.mjs';
	import js from 'shiki/langs/javascript.mjs';
	import svelte from 'shiki/langs/svelte.mjs';
	import ts from 'shiki/langs/ts.mjs';

	const shiki = createHighlighterCoreSync({
		engine: createJavaScriptRegexEngine(),
		themes: [ayuDark],
		langs: [console, html, css, js, bash, ts, svelte]
	});
</script>

<script lang="ts">
	import type { CodeBlockProps } from './types';

	let {
		code = '',
		lang = 'console',
		theme = 'ayu-dark',
		// Base Style Props
		base = ' overflow-hidden',
		rounded = 'rounded-container',
		shadow = '',
		classes = '',
		// Pre Style Props
		preBase = '',
		prePadding = '[&>pre]:p-4',
		preClasses = ''
	}: CodeBlockProps = $props();

	const generatedHtml = shiki.codeToHtml(code, { lang, theme });
</script>

<div class="{base} {rounded} {shadow} {classes} {preBase} {prePadding} {preClasses} font-code">
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	{@html generatedHtml}
</div>
