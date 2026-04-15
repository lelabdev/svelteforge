<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { signupSchema } from '$lib/schemas/signup';
	import { AuthCard, Button, FormField, PasswordInput, SubmitButton } from '$lib/components/ui';
	import Icon from '$lib/components/icons/Icon.svelte';
	import { getFormError } from '$lib/utils/form-errors';
	import { onMount } from 'svelte';

	interface Props {
		data: {
			form: any;
		};
	}

	let { data }: Props = $props();

	let confirmPassword = $state('');
	let error = $state('');

	// svelte-ignore state_referenced_locally
	const { form, enhance, submitting, message, errors } = superForm(data.form, {
		validators: zod4Client(signupSchema),
		resetForm: false,
		onError: ({ result }) => {
			if (result && 'data' in result) {
				const errorData = result.data as any;
				if (errorData?.message) {
					error = errorData.message;
				}
			}
		},
		onSubmit: () => {
			error = '';
		}
	});

	let passwordsMatch = $derived(!confirmPassword || $form.password === confirmPassword);
	let formValid = $derived(
		$form.email &&
			$form.password &&
			$form.name &&
			confirmPassword &&
			passwordsMatch &&
			$form.password.length >= 8
	);

	function getPasswordStrength(password: string): {
		strength: number;
		color: string;
		label: string;
	} {
		if (!password) return { strength: 0, color: 'bg-error-500', label: '' };

		let score = 0;
		if (password.length >= 8) score++;
		if (password.length >= 12) score++;
		if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
		if (/\d/.test(password)) score++;
		if (/[^a-zA-Z0-9]/.test(password)) score++;

		const levels = [
			{ color: 'bg-error-500', label: 'Very weak' },
			{ color: 'bg-warning-500', label: 'Weak' },
			{ color: 'bg-warning-400', label: 'Fair' },
			{ color: 'bg-success-400', label: 'Strong' },
			{ color: 'bg-success-500', label: 'Very strong' }
		];

		return { strength: score, ...levels[Math.min(score, 4)] };
	}

	let passwordStrength = $derived(getPasswordStrength($form.password || ''));
	let progressWidth = $derived(`${(passwordStrength.strength / 5) * 100}%`);

	onMount(() => {
		document.getElementById('email')?.focus();
	});
</script>

<svelte:head>
	<title>Sign Up</title>
	<meta name="description" content="Create your account." />
</svelte:head>

<AuthCard title="Sign Up" subtitle="Create your account">
	{#if error}
		<div
			class="bg-error-500/10 border border-error-500/30 text-error-700 dark:text-error-300 p-4 rounded-xl mb-6 flex items-start gap-3"
			role="alert"
		>
			<Icon name="alertCircle" size={20} class="shrink-0 mt-0.5" />
			<div>
				<p class="font-semibold">Error</p>
				<p class="text-sm mt-0.5">{error}</p>
			</div>
		</div>
	{/if}

	{#if $message}
		<div
			class="bg-success-500/10 border border-success-500/30 text-success-700 dark:text-success-300 p-4 rounded-xl mb-6 flex items-start gap-3"
			role="status"
		>
			<p class="text-sm">{$message}</p>
		</div>
	{/if}

	<form method="POST" use:enhance class="space-y-5">
		<FormField
			id="name"
			name="name"
			bind:value={$form.name}
			label="Name"
			placeholder="Your name"
			error={getFormError($errors?.name)}
			required
		/>

		<FormField
			id="email"
			name="email"
			bind:value={$form.email}
			label="Email"
			type="email"
			placeholder="you@example.com"
			error={getFormError($errors?.email)}
			required
		/>

		<PasswordInput
			id="password"
			name="password"
			bind:value={$form.password}
			label="Password"
			error={getFormError($errors?.password)}
			showStrength={false}
			required
		/>

		<!-- Password strength indicator -->
		{#if $form.password}
			<div class="space-y-1">
				<div class="flex items-center justify-between text-xs">
					<span class="text-neutral-600 dark:text-neutral-400">
						Strength: {passwordStrength.label}
					</span>
				</div>
				<div
					class="h-1.5 w-full bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden"
				>
					<div
						class="h-full transition-all duration-300 ease-out {passwordStrength.color}"
						style="width: {progressWidth}"
					></div>
				</div>
			</div>
		{/if}

		<FormField
			id="confirmPassword"
			name="confirmPassword"
			bind:value={confirmPassword}
			label="Confirm password"
			type="password"
			error={confirmPassword && !passwordsMatch ? 'Does not match' : ''}
			required
		/>

		<SubmitButton
			loading={$submitting}
			text="Create my account"
			loadingText="Creating account..."
			disabled={!formValid}
		/>
	</form>

	<!-- Global errors from Superforms -->
	{#if $form._errors?.length}
		<div
			class="bg-error-500/10 border border-error-500/30 text-error-700 dark:text-error-300 p-4 rounded-xl mt-4"
		>
			{$form._errors[0]}
		</div>
	{/if}

	{#snippet footer()}
		<p class="text-center text-sm text-neutral-600 dark:text-neutral-400">
			Already have an account?
			<a
				href="/login"
				class="text-primary-500 hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300 font-medium transition-colors"
			>
				Sign in
			</a>
		</p>
	{/snippet}
</AuthCard>
