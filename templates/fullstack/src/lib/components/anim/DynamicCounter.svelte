<script lang="ts">
	import { onMount } from 'svelte';

	const {
		target = 0,
		duration = 2,
		suffix = '',
		prefix = '',
		once = true
	}: {
		target: number;
		duration?: number;
		suffix?: string;
		prefix?: string;
		once?: boolean;
	} = $props();

	let container: HTMLElement;
	let currentValue = $state(0);
	let hasAnimated = $state(false);

	onMount(() => {
		if (!container) return;

		const observer = new IntersectionObserver(
			(entries) => {
				const entry = entries[0];
				if (entry.isIntersecting && (!hasAnimated || !once)) {
					hasAnimated = true;

					const startTime = performance.now();
					const animate = () => {
						const elapsed = performance.now() - startTime;
						const progress = Math.min(elapsed / (duration * 1000), 1);
						const easedProgress = 1 - Math.pow(1 - progress, 3);
						currentValue = Math.round(easedProgress * target);

						if (progress < 1) {
							requestAnimationFrame(animate);
						}
					};

					requestAnimationFrame(animate);

					if (once) {
						observer.disconnect();
					}
				} else if (!entry.isIntersecting && !once) {
					currentValue = 0;
				}
			},
			{
				threshold: 0.1,
				rootMargin: '0px 0px -10% 0px'
			}
		);

		observer.observe(container);
		return () => observer.disconnect();
	});
</script>

<span bind:this={container}>{prefix}{currentValue}{suffix}</span>
