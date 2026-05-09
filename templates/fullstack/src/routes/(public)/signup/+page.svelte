<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { signupSchema } from '$lib/schemas';
	import { AuthCard, Button, FormField, PasswordInput } from '$lib/components';

	let { data } = $props();

	const { form, errors, enhance, submitting } = superForm(data.form, {
		validators: zod4Client(signupSchema),
		dataType: 'json',
		invalidateAll: false,
		TTL: 0
	});
</script>

<AuthCard title="Create account" subtitle="Get started with SvelteForge">
	<form method="POST" use:enhance class="space-y-4">
		<FormField
			label="Name"
			id="name"
			type="text"
			name="name"
			placeholder="Your name"
			bind:value={$form.name}
			error={$errors.name}
		/>

		<FormField
			label="Email"
			id="email"
			type="email"
			name="email"
			placeholder="you@example.com"
			required
			bind:value={$form.email}
			error={$errors.email}
		/>

		<PasswordInput
			id="password"
			label="Password"
			name="password"
			placeholder="••••••••"
			required
			showStrength
			bind:value={$form.password}
			error={$errors.password}
		/>

		<PasswordInput
			id="confirmPassword"
			label="Confirm password"
			name="confirmPassword"
			placeholder="••••••••"
			required
			bind:value={$form.confirmPassword}
			error={$errors.confirmPassword}
		/>

		<Button
			type="submit"
			variant="primary"
			size="lg"
			loading={$submitting}
			class="w-full"
			style="font-weight: var(--weight-label)"
		>
			Create Account
		</Button>
	</form>

	{#snippet footer()}
		<p class="text-center text-surface-600-400" style="font-size: var(--text-body)">
			Already have an account?
			<Button variant="ghost" size="sm" href="/login" class="text-primary-600-400 hover:text-primary-700-300">
				Sign in
			</Button>
		</p>
	{/snippet}
</AuthCard>
