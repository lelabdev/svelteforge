<script lang="ts">
	import { AuthCard, Checkbox, ErrorAlert, SuccessAlert, FormField, PasswordInput, SubmitButton } from '$lib/components/ui';
	import { loginSchema } from '$lib/schemas/login';
	import { getFormError } from '$lib/utils/form-errors';
	import { onMount, tick } from 'svelte';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';

	let { data } = $props();

	let passwordReset = $derived(data.reset === 'true');

	// svelte-ignore state_referenced_locally
	const { form, enhance, errors, submitting, message } = superForm(data.form, {
		validators: zod4Client(loginSchema),
		resetForm: false
	});

	// Clear password on error
	$effect(() => {
		if ($message) {
			$form.password = '';
		}
	});

	onMount(async () => {
		await tick();
		document.getElementById('email')?.focus();
	});
</script>

<AuthCard title="Sign In" subtitle="Access your account">
	{#if passwordReset}
		<SuccessAlert title="Password Reset" message="Your password has been reset successfully." class="mb-6" />
	{/if}
	{#if $message}
		<ErrorAlert title="Sign in failed" message={$message} class="mb-6" />
	{/if}

	<form method="POST" use:enhance class="space-y-5">
		<FormField
			id="email"
			name="email"
			bind:value={$form.email}
			label="Email"
			type="email"
			placeholder="you@example.com"
			error={getFormError($errors.email)}
			required
		/>

		<div class="space-y-2">
			<PasswordInput
				id="password"
				name="password"
				label="Password"
				bind:value={$form.password}
				placeholder="••••••••"
				error={getFormError($errors.password)}
				required
			/>

			<a
				href="/forgot-password"
				class="text-sm text-primary-500 hover:text-primary-600-400 transition-colors"
			>
				Forgot password?
			</a>
		</div>

		<Checkbox
			id="remember-me"
			name="rememberMe"
			bind:checked={$form.rememberMe}
			label="Remember me"
		/>

		<SubmitButton loading={$submitting} text="Sign in" loadingText="Signing in..." />
	</form>

	{#snippet footer()}
		<p class="text-center text-sm text-surface-600-400">
			Don't have an account?
			<a
				href="/signup"
				class="text-primary-500 hover:text-primary-600-400 font-medium transition-colors"
			>
				Sign up
			</a>
		</p>
	{/snippet}
</AuthCard>
