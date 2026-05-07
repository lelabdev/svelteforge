<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { passwordForgotSchema } from '$lib/schemas';
	import { AuthCard, Button, FormField } from '$lib/components';

	let { data } = $props();

	const { form, errors, enhance, submitting, message } = superForm(data.form, {
		validators: zod4Client(passwordForgotSchema),
		dataType: 'json',
		invalidateAll: false,
		TTL: 0
	});
</script>

<AuthCard title="Forgot password" subtitle="Enter your email to receive a reset link">
	<form method="POST" use:enhance class="space-y-4">
		{#if $message}
			<p class="rounded-lg bg-surface-100-800 p-3 text-center text-success-700-300" style="font-size: var(--text-sm)">
				{$message}
			</p>
		{/if}

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

		<Button
			type="submit"
			variant="primary"
			size="lg"
			loading={$submitting}
			class="w-full"
			style="font-weight: var(--weight-label)"
		>
			Send Reset Link
		</Button>
	</form>

	{#snippet footer()}
		<p class="text-center text-surface-600-400" style="font-size: var(--text-body)">
			Remember your password?
			<Button variant="ghost" size="sm" href="/login" class="text-primary-600-400 hover:text-primary-700-300">
				Sign in
			</Button>
		</p>
	{/snippet}
</AuthCard>
