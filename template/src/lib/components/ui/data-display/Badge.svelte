<script lang="ts">
	import { cn } from '../utils/cn';

	type BadgeVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'surface';

	interface Props {
		variant?: BadgeVariant;
		class?: string;
		children: any;
	}

	let { variant = 'surface', class: className = '', children }: Props = $props();

	const variants: Record<BadgeVariant, string> = {
		primary: 'preset-tonal-primary-500',
		secondary: 'preset-tonal-secondary-500',
		success: 'preset-tonal-success-500',
		warning: 'preset-tonal-warning-500',
		error: 'preset-tonal-error-500',
		surface: 'preset-tonal-surface-500'
	};

	const badgeClass = $derived(cn('badge', variants[variant], className));
</script>

<span class={badgeClass}>{@render children()}</span>
