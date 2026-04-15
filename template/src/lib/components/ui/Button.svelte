<script lang="ts">
	import { cn } from './utils/cn';

	type ButtonVariant =
		| 'primary'
		| 'secondary'
		| 'outline'
		| 'ghost'
		| 'danger'
		| 'success'
		| 'glass'
		| 'cta'
		| 'tonal'
		| 'none';
	type ButtonSize = 'sm' | 'md' | 'lg';

	interface Props {
		variant?: ButtonVariant;
		size?: ButtonSize;
		class?: string;
		children: any;
		onclick?: (event: MouseEvent) => void;
		onmouseenter?: () => void;
		onmouseleave?: () => void;
		disabled?: boolean;
		loading?: boolean;
		type?: 'button' | 'submit' | 'reset';
		href?: string;
		target?: string;
		ariaLabel?: string;
		id?: string;
	}

	let {
		variant = 'primary',
		size = 'md',
		class: className = '',
		children,
		onclick,
		onmouseenter,
		onmouseleave,
		disabled = false,
		loading = false,
		type = 'button',
		href,
		target,
		ariaLabel,
		id
	}: Props = $props();

	// Utilise les presets SkeletonUI pour une meilleure intégration du thème
	const variants = {
		primary: 'preset-filled-primary-500',
		secondary: 'preset-filled-secondary-500',
		outline: 'preset-outlined-primary-500',
		ghost:
			'hover:bg-surface-200-800 text-surface-700-300 hover:text-surface-900-50',
		danger: 'preset-filled-error-500',
		success: 'preset-filled-success-500',
		glass:
			'backdrop-blur-md bg-primary-500/20 border-2 border-primary-400/50 text-primary-300 hover:bg-primary-500/30 hover:border-primary-400/70 hover:text-primary-200 transition-all duration-300',
		cta: 'preset-filled-primary-500 shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30 transition-all duration-300 motion-reduce:transition-none btn-shine',
		tonal: 'preset-tonal-primary',
		none: ''
	};

	const sizes = {
		sm: 'btn-sm',
		md: 'btn-base',
		lg: 'btn-lg'
	};

	const buttonClass = $derived(cn('btn', variants[variant], sizes[size], className));
</script>

<svelte:element
	this={href ? 'a' : 'button'}
	{href}
	{id}
	target={href ? target : undefined}
	rel={target === '_blank' ? 'noopener noreferrer' : undefined}
	type={href ? undefined : type}
	{onclick}
	{onmouseenter}
	{onmouseleave}
	disabled={href ? undefined : disabled || loading}
	aria-disabled={href && disabled ? 'true' : undefined}
	aria-label={ariaLabel}
	role={href ? 'button' : undefined}
	class={buttonClass}
>
	{#if loading}
		<span class="flex items-center justify-center gap-2">
			<span class="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin"
			></span>
			{@render children()}
		</span>
	{:else}
		{@render children()}
	{/if}
</svelte:element>
