<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { loginSchema } from '$lib/schemas';
	import { AuthCard, Button, FormField, PasswordInput } from '$lib/components';

	let { data } = $props();

	const { form, errors, enhance, submitting } = superForm(data.form, {
		validators: zod4Client(loginSchema),
		dataType: 'json',
		invalidateAll: false,
		TTL: 0
	});
</script>

<AuthCard title="Welcome back" subtitle="Sign in to your account">
	<form method="POST" use:enhance class="space-y-4">
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
			bind:value={$form.password}
			error={$errors.password}
		/>

		<div class="flex justify-end">
			<Button variant="ghost" size="sm" href="/forgot-password" class="text-primary-600-400 hover:text-primary-700-300">
				Forgot password?
			</Button>
		</div>

		<Button
			type="submit"
			variant="primary"
			size="lg"
			loading={$submitting}
			class="w-full"
			style="font-weight: var(--weight-label)"
		>
			Sign In
		</Button>
	</form>

	{#snippet footer()}
		<p class="text-center text-surface-600-400" style="font-size: var(--text-body)">
			Don't have an account?
			<Button variant="ghost" size="sm" href="/signup" class="text-primary-600-400 hover:text-primary-700-300">
				Sign up
			</Button>
		</p>
	{/snippet}
</AuthCard>
