<script lang="ts">
	import { onMount, type Snippet } from 'svelte';
	import { cubicOut } from 'svelte/easing';
	import { fly } from 'svelte/transition';

	type Direction = 'up' | 'down' | 'left' | 'right';

	const {
		direction = 'up',
		distance = 30,
		duration = 0.9,
		delay = 0.2,
		easing = cubicOut,
		once = false,
		children
	}: {
		direction?: Direction;
		distance?: number;
		duration?: number;
		delay?: number;
		easing?: (t: number) => number;
		once?: boolean;
		children: Snippet;
	} = $props();

	let element: HTMLElement;
	let visible = $state(false);
	let hasAnimated = $state(false);

	function getTransitionParams(): Parameters<typeof fly>[1] {
		const params: Record<string, any> = {
			duration: duration * 1000,
			delay: delay * 1000,
			easing
		};

		switch (direction) {
			case 'up':
				params.y = distance;
				break;
			case 'down':
				params.y = -distance;
				break;
			case 'left':
				params.x = -distance;
				break;
			case 'right':
				params.x = distance;
				break;
		}

		return params;
	}

	onMount(() => {
		if (!element) return;

		const observer = new IntersectionObserver(
			(entries) => {
				const [entry] = entries;

				if (entry.isIntersecting && (!hasAnimated || !once)) {
					visible = true;
					hasAnimated = true;

					if (once) {
						observer.disconnect();
					}
				} else if (!entry.isIntersecting && !once) {
					visible = false;
				}
			},
			{
				threshold: 0.1,
				rootMargin: '0px 0px -10% 0px'
			}
		);

		observer.observe(element);

		return () => observer.disconnect();
	});
</script>

<div bind:this={element}>
	{#if visible}
		<div in:fly|local={getTransitionParams()}>
			{@render children()}
		</div>
	{:else}
		<div style="opacity: 0;">
			{@render children()}
		</div>
	{/if}
</div>
