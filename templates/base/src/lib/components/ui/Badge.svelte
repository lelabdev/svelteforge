<script lang="ts">
	import { cn } from '$lib/utils/cn';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	type Color = 'primary' | 'secondary' | 'tertiary' | 'success' | 'warning' | 'error' | 'surface';

	interface Props extends HTMLAttributes<HTMLSpanElement> {
		color?: Color;
		outlined?: boolean;
		class?: string;
		children: Snippet;
	}

	let { color = 'primary', outlined = false, class: className, children, ...rest }: Props = $props();
</script>

<span
	class={cn(
		'badge',
		outlined ? 'preset-outlined' : 'preset-filled',
		`variant-${color}`,
		className
	)}
	{...rest}
>
	{@render children()}
</span>
