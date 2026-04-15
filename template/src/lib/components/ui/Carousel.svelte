<script lang="ts">
	import { Carousel } from '@skeletonlabs/skeleton-svelte';
	import type { Snippet } from 'svelte';
	import { cn } from './utils/cn';

	interface Props {
		/** Total number of slides. Required by the underlying Carousel. */
		slideCount: number;
		/** Snippet rendered inside the slide area. Wrap each slide in `<Carousel.Item index={i}>`. */
		children: Snippet;
		/** Number of slides visible per page. */
		slidesPerPage?: number;
		/** Gap between slides, e.g. `'16px'`. */
		spacing?: string;
		/** Show an autoplay toggle in the control bar. */
		autoplay?: boolean;
		/** Loop back to the first slide after the last. */
		loop?: boolean;
		/** Render previous / next navigation controls. */
		showControls?: boolean;
		/** Render dot indicators below the carousel. */
		showDots?: boolean;
		/** Additional CSS classes for the wrapper element. */
		class?: string;
	}

	let {
		slideCount,
		children,
		slidesPerPage = 1,
		spacing = '16px',
		autoplay = false,
		loop = false,
		showControls = true,
		showDots = true,
		class: className = ''
	}: Props = $props();

	const wrapperClass = $derived(cn('carousel-wrapper', className));
</script>

<div class={wrapperClass} style="border-radius: var(--radius-card)">
	<Carousel {slideCount} {slidesPerPage} {spacing} {loop}>
		{#if showControls}
			<Carousel.Control class="carousel-controls" style="gap: var(--gap-sm)">
				<Carousel.PrevTrigger class="btn preset-tonal-surface-500" aria-label="Previous slide">
					<span>&larr;</span>
					<span>Back</span>
				</Carousel.PrevTrigger>

				{#if autoplay}
					<Carousel.AutoplayTrigger class="btn preset-tonal-surface-500">
						Autoplay
					</Carousel.AutoplayTrigger>
				{/if}

				<Carousel.NextTrigger class="btn preset-tonal-surface-500" aria-label="Next slide">
					<span>Next</span>
					<span>&rarr;</span>
				</Carousel.NextTrigger>
			</Carousel.Control>
		{/if}

		<Carousel.ItemGroup>
			{@render children()}
		</Carousel.ItemGroup>

		{#if showDots}
			<Carousel.IndicatorGroup class="carousel-dots" style="gap: var(--gap-sm)">
				<Carousel.Context>
					{#snippet children(carousel)}
						{#each carousel().pageSnapPoints as _, index (index)}
							<Carousel.Indicator {index} class="carousel-dot" />
						{/each}
					{/snippet}
				</Carousel.Context>
			</Carousel.IndicatorGroup>
		{/if}
	</Carousel>
</div>

<style>
	.carousel-wrapper {
		overflow: hidden;
	}

	.carousel-controls {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: var(--gap-sm);
	}

	.carousel-dots {
		display: flex;
		justify-content: center;
		margin-top: var(--gap-sm);
	}

	.carousel-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background-color: var(--color-surface-400-600);
		transition: background-color 0.2s ease, transform 0.2s ease;
	}

	.carousel-dot:global([data-active='true']) {
		background-color: var(--color-primary-500);
		transform: scale(1.25);
	}

	.carousel-dot:hover {
		background-color: var(--color-surface-500);
	}
</style>
