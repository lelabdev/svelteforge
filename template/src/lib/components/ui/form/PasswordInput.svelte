<script lang="ts">
	import Icon from '$lib/components/icons/Icon.svelte';
	import { cn } from '../utils/cn';

	interface Props {
		id: string;
		label: string;
		value: string | undefined;
		placeholder?: string;
		required?: boolean;
		disabled?: boolean;
		error?: string;
		showStrength?: boolean;
		minLength?: number;
		class?: string;
		name?: string;
		onblur?: () => void;
	}

	let {
		id,
		label,
		value = $bindable(),
		placeholder = '••••••••',
		required = false,
		disabled = false,
		error = '',
		showStrength = false,
		minLength = 8,
		class: className = '',
		name,
		onblur
	}: Props = $props();

	// Local state for the input value
	let initialValue = value ?? '';
	let inputValue = $state(initialValue);

	// Sync input value back to parent
	$effect(() => {
		value = inputValue;
	});

	let showPassword = $state(false);

	function getPasswordStrength(password: string): {
		strength: number;
		color: string;
		label: string;
	} {
		if (!password) return { strength: 0, color: 'bg-surface-300-600', label: '' };

		let score = 0;
		if (password.length >= minLength) score++;
		if (password.length >= minLength + 4) score++;
		if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
		if (/\d/.test(password)) score++;
		if (/[^a-zA-Z0-9]/.test(password)) score++;

		const levels = [
			{ color: 'bg-error-500', label: 'Very weak' },
			{ color: 'bg-warning-500', label: 'Weak' },
			{ color: 'bg-yellow-500', label: 'Fair' },
			{ color: 'bg-lime-500', label: 'Strong' },
			{ color: 'bg-success-500', label: 'Very strong' }
		];

		return { strength: score, ...levels[Math.min(score, 4)] };
	}

	const strength = $derived(getPasswordStrength(inputValue));
	const progressWidth = $derived(`${(strength.strength / 5) * 100}%`);

	const togglePassword = () => {
		showPassword = !showPassword;
	};

	const containerClass = $derived(cn('space-y-1', className));

	const inputWrapperClass = $derived(
		cn(
			'relative flex items-center',
			'border border-surface-300-700',
			'transition-all duration-200',
			'focus-within:ring-2 focus-within:ring-primary-500/50 focus-within:border-primary-500',
			error && 'border-error-500 focus-within:ring-error-500/50 focus-within:border-error-500'
		)
	);

	const inputClass = $derived(
		cn(
			'w-full pr-10',
			'bg-transparent border-0 focus:outline-none',
			'text-surface-900-100',
			'placeholder:text-surface-400-500',
			'disabled:opacity-50 disabled:cursor-not-allowed'
		)
	);

	const toggleButtonClass = $derived(
		cn(
			'absolute right-2 p-1.5',
			'text-surface-400-600 hover:text-surface-600-400',
			'hover:bg-surface-100-700',
			'transition-all duration-200',
			'focus:outline-none focus:ring-2 focus:ring-primary-500/50',
			'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent'
		)
	);
</script>

<div class={containerClass}>
	<label for={id} class="label">
		<span class="label-text flex justify-between items-center" style="gap: var(--gap-lg); font-size: var(--text-label); font-weight: var(--weight-label)">
			<span class="flex items-center" style="gap: var(--gap-sm)">
				{label}
				{#if required}
					<span class="text-error-500">*</span>
				{/if}
			</span>
			{#if error}
				<span class="text-error-500 shrink-0" style="font-size: var(--text-caption); font-weight: var(--weight-label)">{error}</span>
			{/if}
		</span>
	</label>

	<div class={inputWrapperClass} style="border-radius: var(--radius-input-custom)">
		<input
			{id}
			{name}
			type={showPassword ? 'text' : 'password'}
			bind:value={inputValue}
			{placeholder}
			{required}
			{disabled}
			{onblur}
			class={inputClass}
			style="padding-left: var(--input-custom-px); padding-top: var(--input-custom-py); padding-bottom: var(--input-custom-py); border-radius: var(--radius-input-custom); font-size: var(--text-body)"
		/>
		<button
			type="button"
			onclick={togglePassword}
			class={toggleButtonClass}
			style="border-radius: var(--radius-toggle)"
			aria-label={showPassword ? 'Hide password' : 'Show password'}
			tabindex="-1"
		>
			{#if showPassword}
				<Icon name="eyeOff" size={16} />
			{:else}
				<Icon name="eye" size={16} />
			{/if}
		</button>
	</div>

	{#if showStrength && inputValue}
		<div class="space-y-1" style="margin-top: var(--space-inline)">
			<div class="flex items-center justify-between" style="font-size: var(--text-caption)">
				<span class="text-surface-600-400 flex items-center" style="gap: var(--gap-xs)">
					{#if strength.strength === 0}
						<Icon name="shield" size={12} />
					{:else if strength.strength <= 2}
						<Icon name="shieldX" size={12} />
					{:else}
						<Icon name="shieldCheck" size={12} />
					{/if}
					Strength: {strength.label}
				</span>
			</div>
			<div class="w-full bg-surface-300 dark:bg-surface-600 rounded-full overflow-hidden" style="height: var(--strength-bar-h)">
				<div
					class="h-full transition-all duration-300 ease-out {strength.color}"
					style="width: {progressWidth}"
				></div>
			</div>
		</div>
	{/if}
</div>
