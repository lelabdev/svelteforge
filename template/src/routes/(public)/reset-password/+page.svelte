<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { resetPasswordSchema } from '$lib/schemas/password';
	import { AuthCard, ErrorAlert, Button, SubmitButton } from '$lib/components/ui';
	import { getFormError } from '$lib/utils/form-errors';

	let { data } = $props();

	// svelte-ignore state_referenced_locally: data from SvelteKit load doesn't change after init
	const { form, enhance, errors, submitting, message } = superForm(data.form, {
		validators: zod4Client(resetPasswordSchema),
		resetForm: false
	});

	// Get token from server data
	let token = $derived(data.token || '');

	// Local state for confirm password (not in schema)
	let confirmPassword = $state('');

	// Derived: passwords match
	let passwordsMatch = $derived(!confirmPassword || $form.password === confirmPassword);
</script>

<svelte:head>
	<title>Reset Password - SvelteForge</title>
	<meta name="description" content="Reset your SvelteForge password." />
</svelte:head>

<div class="container mx-auto px-4 max-w-md py-8">
	<AuthCard title="Reset password" subtitle="Enter your new password">
		{#if !token}
			<ErrorAlert
				title="Error"
				message="Reset token is missing. Please use the link sent by email."
				class="mb-6"
			/>

			<div class="mt-6 text-center">
				<Button href="/forgot-password" variant="ghost" size="md">Request a new link</Button>
			</div>
		{:else}
			{#if $message}
				<ErrorAlert message={$message} class="mb-6" />
			{/if}

			<form method="POST" use:enhance class="space-y-5">
				<div class="space-y-2">
					<label for="password" class="label">
						<span class="label-text">New password</span>
					</label>
					<input
						id="password"
						name="password"
						type="password"
						bind:value={$form.password}
						placeholder="•••••••"
						required
						minlength={8}
						class="input w-full"
					/>
					{#if $errors.password}
						<p class="text-sm text-error-500">{getFormError($errors.password)}</p>
					{/if}
				</div>

				<div class="space-y-2">
					<label for="confirmPassword" class="label">
						<span class="label-text">Confirm password</span>
					</label>
					<input
						id="confirmPassword"
						name="confirmPassword"
						type="password"
						bind:value={confirmPassword}
						placeholder="•••••••"
						required
						minlength={8}
						class="input w-full"
					/>
					{#if confirmPassword && !passwordsMatch}
						<p class="text-sm text-error-500">Passwords do not match</p>
					{/if}
				</div>

				<SubmitButton
					loading={$submitting}
					text="Reset password"
					loadingText="Resetting..."
					disabled={!passwordsMatch}
				/>
			</form>

			<div class="mt-6 text-center">
				<Button href="/login" variant="ghost" size="md">Back to sign in</Button>
			</div>
		{/if}
	</AuthCard>
</div>
