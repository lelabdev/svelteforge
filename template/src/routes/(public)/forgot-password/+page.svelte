<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { forgotPasswordSchema } from '$lib/schemas/password';
	import {
		AuthCard,
		SuccessAlert,
		ErrorAlert,
		FormField,
		SubmitButton,
		Button
	} from '$lib/components/ui';
	import { getFormError } from '$lib/utils/form-errors';

	let { data } = $props();

	// svelte-ignore state_referenced_locally: data from SvelteKit load doesn't change after init
	const { form, enhance, errors, submitting, message } = superForm(data.form, {
		validators: zod4Client(forgotPasswordSchema),
		resetForm: true,
		onUpdated: async ({ form }) => {
			if (form.valid) {
				// Trigger success state when form is valid
				success = true;
			}
		}
	});

	// Local success state
	let success = $state(false);
</script>

<svelte:head>
	<title>Forgot Password - SvelteForge</title>
	<meta name="description" content="Reset your SvelteForge password." />
</svelte:head>

<div class="container mx-auto px-4 max-w-md py-8">
	<AuthCard
		title="Forgot your password?"
		subtitle="Enter your email to receive a recovery link"
	>
		{#if success}
			<SuccessAlert
				title="Email sent"
				message="A recovery email has been sent to your address. Please check your inbox."
				class="mb-6"
			/>

			<div class="mt-6 text-center">
				<Button href="/login" variant="ghost" size="md">Back to sign in</Button>
			</div>
		{:else}
			{#if $message}
				<ErrorAlert message={$message} class="mb-6" />
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

				<SubmitButton
					loading={$submitting}
					text="Send recovery link"
					loadingText="Sending..."
				/>
			</form>

			<div class="mt-6 text-center">
				<Button href="/login" variant="ghost" size="md">Back to sign in</Button>
			</div>
		{/if}
	</AuthCard>
</div>
