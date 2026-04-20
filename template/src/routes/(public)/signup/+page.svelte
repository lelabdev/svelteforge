<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { signupSchema } from '$lib/schemas/signup';
	import { AuthCard, Alert, FormField, PasswordInput, SubmitButton } from '$lib/components/ui';
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
		<Alert variant="error" message={error} class="mb-6" />
	{/if}

	{#if $message}
		<Alert variant="success" message={$message} class="mb-6" />
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
			showStrength={true}
			required
		/>

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

	{#snippet footer()}
		<p class="text-center text-sm text-surface-600-400">
			Already have an account?
			<a
				href="/login"
				class="text-primary-500 hover:text-primary-600-400 font-medium transition-colors"
			>
				Sign in
			</a>
		</p>
	{/snippet}
</AuthCard>
