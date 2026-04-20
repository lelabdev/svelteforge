<script lang="ts">
	import Icon from '../../icons/Icon.svelte';
	import { cn } from '../utils/cn';

	interface Step {
		label: string;
		description?: string;
	}

	interface Props {
		steps: Step[];
		currentStep?: number;
		orientation?: 'horizontal' | 'vertical';
		class?: string;
	}

	let {
		steps,
		currentStep = $bindable(0),
		orientation = 'horizontal',
		class: className = ''
	}: Props = $props();

	function getStepStatus(index: number): 'completed' | 'current' | 'upcoming' {
		if (index < currentStep) return 'completed';
		if (index === currentStep) return 'current';
		return 'upcoming';
	}
</script>

{#if steps.length > 0}
	<div
		class={cn('stepper', `stepper-${orientation}`, className)}
		role="group"
		aria-label="Progress steps"
	>
		{#each steps as step, i (i)}
			{@const status = getStepStatus(i)}

			<div class={cn('step', `step-${status}`)}>
				<!-- Step circle -->
				<div class="step-circle-wrapper">
					<div
						class={cn('step-circle', `step-circle-${status}`)}
						aria-current={status === 'current' ? 'step' : undefined}
					>
						{#if status === 'completed'}
							<Icon name="check" size={14} class="step-icon" />
						{:else}
							<span class="step-number">{i + 1}</span>
						{/if}
					</div>

					<!-- Connector line -->
					{#if i < steps.length - 1}
						<div
							class={cn(
								'step-connector',
								`step-connector-${status === 'completed' ? 'completed' : 'incomplete'}`
							)}
						></div>
					{/if}
				</div>

				<!-- Step label -->
				<div class="step-content">
					<span class={cn('step-label', `step-label-${status}`)}>{step.label}</span>
					{#if step.description}
						<span class="step-description">{step.description}</span>
					{/if}
				</div>
			</div>
		{/each}
	</div>
{/if}

<style>
	/* Layout */
	.stepper {
		display: flex;
		gap: var(--gap-lg);
	}

	.stepper-horizontal {
		flex-direction: row;
		align-items: flex-start;
	}

	.stepper-vertical {
		flex-direction: column;
	}

	/* Step row/column */
	.step {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: var(--gap-sm);
		flex: 1;
	}

	.stepper-vertical .step {
		flex: 0;
	}

	/* Circle + connector wrapper */
	.step-circle-wrapper {
		display: flex;
		flex-direction: row;
		align-items: center;
		flex: 1;
	}

	.stepper-vertical .step-circle-wrapper {
		flex-direction: column;
		align-self: stretch;
		flex: 0;
	}

	/* Circle */
	.step-circle {
		width: 2rem;
		height: 2rem;
		min-width: 2rem;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: var(--text-caption);
		font-weight: var(--weight-title);
		transition: all 0.2s ease;
	}

	.step-circle-completed {
		background-color: var(--color-success-500);
		color: white;
	}

	.step-circle-current {
		background-color: var(--color-primary-500);
		color: white;
		box-shadow: 0 0 0 3px var(--color-primary-500 / 20%);
	}

	.step-circle-upcoming {
		background-color: var(--color-surface-200-800);
		color: var(--color-surface-400-600);
		border: 2px solid var(--color-surface-300-700);
	}

	.step-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
	}

	/* Connector */
	.step-connector {
		flex: 1;
		height: 2px;
		margin: 0 var(--gap-xs);
		transition: background-color 0.2s ease;
	}

	.stepper-vertical .step-connector {
		width: 2px;
		height: 1.5rem;
		margin: var(--gap-xs) 0;
		align-self: center;
	}

	.step-connector-completed {
		background-color: var(--color-success-500);
	}

	.step-connector-incomplete {
		background-color: var(--color-surface-300-700);
	}

	/* Content */
	.step-content {
		display: flex;
		flex-direction: column;
		gap: 0;
	}

	.stepper-horizontal .step-content {
		min-width: 0;
		position: absolute;
		top: 2.5rem;
		text-align: center;
	}

	.stepper-horizontal .step {
		position: relative;
		flex-direction: column;
		align-items: center;
	}

	.stepper-horizontal .step-circle-wrapper {
		flex: 0;
	}

	.step-label {
		font-size: var(--text-body);
		font-weight: var(--weight-label);
		white-space: nowrap;
	}

	.step-label-completed {
		color: var(--color-success-500);
	}

	.step-label-current {
		color: var(--color-primary-500);
		font-weight: var(--weight-title);
	}

	.step-label-upcoming {
		color: var(--color-surface-400-600);
	}

	.step-description {
		font-size: var(--text-caption);
		color: var(--color-surface-400-600);
	}

	.step-number {
		line-height: 1;
	}
</style>
